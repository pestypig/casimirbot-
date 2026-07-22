import {
  helixToolOutputRoleForTerminalKind,
  type HelixToolOutputRole,
} from "@shared/helix-terminal-authority";

export type HelixTerminalProductArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

export type HelixTerminalProductMaterializerResult = {
  kind: string;
  text: string;
  ref: string | null;
  supportRefs?: string[];
  rejectedSupportRefs?: string[];
  artifact?: HelixTerminalProductArtifactLike;
  outputRole?: HelixToolOutputRole | null;
};

export type HelixProviderRouteProductEligibility = {
  target_kind: string | null;
  route_allows_target_kind: boolean;
  provider_authored_target_kind: boolean;
  provider_bridge_source: "top_level" | "current_turn_artifact" | "none";
  provider_bridge_authorizes_candidate: boolean;
  authority_matches_current_turn: boolean;
  presentation_matches_current_turn: boolean;
  authority_shape_valid: boolean;
  presentation_shape_valid: boolean;
  authority_ref_current_turn_scoped: boolean;
  usable_text_present: boolean;
  support_refs_required: boolean;
  requested_support_ref_count: number;
  current_turn_support_ref_count: number;
  rejection_reason: string | null;
};

export type HelixPostulateRuntimeReviewTerminal = {
  text: string;
  terminalResult: Record<string, unknown>;
  terminalPresentation: Record<string, unknown>;
  terminalArtifactId: string;
  debugPatch: Record<string, unknown>;
  artifact: HelixTerminalProductArtifactLike;
};

const PROVIDER_AUTHORED_ROUTE_PRODUCT_KINDS = new Set([
  "direct_answer_text",
  "model_synthesized_answer",
  "doc_evidence_synthesis_answer",
  "repo_code_evidence_answer",
  "compound_evidence_synthesis_answer",
  "compound_research_locator_answer",
  "scholarly_research_answer",
  "internet_search_answer",
  "workspace_status_answer",
  "capability_help_summary",
  "workstation_tool_evaluation",
  "theory_context_reflection_answer",
  "situation_room_live_job_setup_answer",
]);

export const isProviderAuthoredRouteProductKind = (kind: string): boolean =>
  PROVIDER_AUTHORED_ROUTE_PRODUCT_KINDS.has(kind);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const providerTerminalSupportRefsRequired = (
  providerBridge: Record<string, unknown> | null,
  candidate: Record<string, unknown> | null,
): boolean => !(
  providerBridge?.model_only_direct_answer_allowed === true &&
  candidate?.evidence_reentry_required === false
);

const withOutputRole = (
  result: HelixTerminalProductMaterializerResult,
): HelixTerminalProductMaterializerResult => ({
  ...result,
  outputRole: result.outputRole ?? helixToolOutputRoleForTerminalKind(result.kind),
});

const isPromptContaminatedCalculatorExpression = (expression: string | null): boolean => {
  if (!expression) return false;
  const compact = expression.replace(/\s+/g, "");
  const mathWordsStripped = compact.replace(/\b(?:Math\.)?(?:sqrt|sin|cos|tan|log10|log|ln|PI|E|pi|e)\b/gi, "");
  return /[A-Za-z]{12,}/.test(mathWordsStripped);
};

const artifactPayload = (artifact: HelixTerminalProductArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const artifactSchema = (artifact: HelixTerminalProductArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.schema);

const artifactKind = (artifact: HelixTerminalProductArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "unknown";

const artifactId = (artifact: HelixTerminalProductArtifactLike): string | null =>
  readString(artifact.artifact_id) ??
  readString((artifact as Record<string, unknown>).artifact_ref) ??
    readString(artifactPayload(artifact)?.artifact_id);

const artifactObservationSucceeded = (artifact: HelixTerminalProductArtifactLike): boolean => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  if ((artifact as Record<string, unknown>).ok === false || payload?.ok === false) return false;
  const statuses = [
    readString((artifact as Record<string, unknown>).status),
    readString(payload?.status),
    readString(observation?.status),
  ].filter((status): status is string => Boolean(status));
  return statuses.every((status) => !/^(?:failed|blocked|missing_input|needs_confirmation|error)$/i.test(status));
};

export const inspectAgentProviderRouteProductEligibility = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  turnId: string;
  requiredTerminalKind: string | null | undefined;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
}): HelixProviderRouteProductEligibility => {
  const targetKind = readString(input.requiredTerminalKind);
  const routeAllowsTargetKind = Boolean(targetKind && input.routeAllowsTerminalKind(targetKind));
  const providerAuthoredTargetKind = Boolean(targetKind && PROVIDER_AUTHORED_ROUTE_PRODUCT_KINDS.has(targetKind));
  const topLevelAuthority = readRecord(input.payload.terminal_answer_authority);
  const topLevelPresentation = readRecord(input.payload.terminal_presentation);
  const persistedProviderBridge = (input.artifacts ?? [])
    .slice()
    .reverse()
    .map((artifact) => ({ artifact, payload: artifactPayload(artifact) }))
    .find(({ artifact, payload }) =>
      artifactKind(artifact) === "provider_terminal_authority_bridge" &&
      readString(payload?.turn_id) === input.turnId,
    )?.payload ?? null;
  const topLevelProviderBridge = readRecord(input.payload.provider_terminal_authority_bridge);
  const providerBridge = topLevelProviderBridge ?? persistedProviderBridge;
  const bridgeSource: HelixProviderRouteProductEligibility["provider_bridge_source"] = topLevelProviderBridge
    ? "top_level"
    : persistedProviderBridge
      ? "current_turn_artifact"
      : "none";
  const bridgeAuthorizesCandidate =
    readString(providerBridge?.turn_id) === input.turnId &&
    providerBridge?.terminal_authority_granted === true &&
    providerBridge?.final_visible_answer_authorized === true;
  const authority = bridgeAuthorizesCandidate
    ? readRecord(providerBridge?.terminal_answer_authority) ?? topLevelAuthority
    : topLevelAuthority;
  const presentation = bridgeAuthorizesCandidate
    ? readRecord(providerBridge?.terminal_presentation) ?? topLevelPresentation
    : topLevelPresentation;
  const debug = readRecord(input.payload.debug);
  const candidate =
    readRecord(input.payload.provider_terminal_candidate) ??
    readRecord(debug?.provider_terminal_candidate) ??
    readRecord(providerBridge?.provider_terminal_candidate);
  const authorityRef =
    readString(authority?.terminal_item_id) ??
    readString(authority?.terminal_artifact_ref) ??
    readString(candidate?.candidate_id);
  const authorityMatchesCurrentTurn = readString(authority?.turn_id) === input.turnId;
  const presentationMatchesCurrentTurn = readString(presentation?.turn_id) === input.turnId;
  const authorityShapeValid =
    readString(authority?.terminal_kind) === "answer" &&
    readString(authority?.terminal_artifact_kind) === "agent_provider_terminal_candidate" &&
    readString(authority?.final_answer_source) === "agent_provider_terminal_candidate" &&
    authority?.server_authoritative === true;
  const presentationShapeValid =
    readString(presentation?.final_answer_source) === "agent_provider_terminal_candidate";
  const authorityRefCurrentTurnScoped = Boolean(authorityRef?.startsWith(`${input.turnId}:`));
  const presentationText = readString(presentation?.concise_text);
  const candidateText = readString(candidate?.candidate_text) ?? readString(candidate?.candidate_text_preview);
  const text =
    (presentationText && !input.invalidText?.(presentationText) ? presentationText : null) ??
    candidateText ??
    readString(input.payload.selected_final_answer) ??
    readString(input.payload.answer) ??
    readString(input.payload.text);
  const usableTextPresent = Boolean(text && !input.invalidText?.(text));
  const artifactLedger = input.artifacts ?? [];
  const currentTurnArtifactRefs = new Set(
    artifactLedger
      .filter((artifact) => {
        const payload = artifactPayload(artifact);
        const sourceScope = artifactFieldString(artifact, "source_scope");
        const artifactTurnId = readString(payload?.turn_id);
        return (
          !/prior_context|prior_turn_context|prior_artifact/i.test(sourceScope ?? "") &&
          (!artifactTurnId || artifactTurnId === input.turnId)
        );
      })
      .map(artifactId)
      .filter((ref): ref is string => Boolean(ref)),
  );
  const requestedSupportRefs = uniqueStrings([
    ...readArray(presentation?.selected_observation_refs).map(readString),
    ...readArray(candidate?.grounded_in_observation_refs).map(readString),
    ...readArray(candidate?.normalized_observation_refs).map(readString),
  ]);
  const currentTurnSupportRefCount = requestedSupportRefs.filter((ref) => currentTurnArtifactRefs.has(ref)).length;
  const supportRefsRequired = providerTerminalSupportRefsRequired(providerBridge, candidate);
  const rejectionReason =
    !targetKind ? "required_terminal_kind_missing" :
    !providerAuthoredTargetKind ? "required_terminal_kind_not_provider_authored" :
    !routeAllowsTargetKind ? "required_terminal_kind_not_route_allowed" :
    !bridgeAuthorizesCandidate && bridgeSource !== "none" ? "provider_bridge_not_authorized" :
    !authorityMatchesCurrentTurn ? "authority_turn_mismatch" :
    !presentationMatchesCurrentTurn ? "presentation_turn_mismatch" :
    !authorityShapeValid ? "authority_shape_invalid" :
    !presentationShapeValid ? "presentation_shape_invalid" :
    !authorityRefCurrentTurnScoped ? "authority_ref_not_current_turn_scoped" :
    !usableTextPresent ? "authorized_text_missing_or_invalid" :
    supportRefsRequired && currentTurnSupportRefCount === 0 ? "current_turn_support_refs_missing" :
    null;
  return {
    target_kind: targetKind,
    route_allows_target_kind: routeAllowsTargetKind,
    provider_authored_target_kind: providerAuthoredTargetKind,
    provider_bridge_source: bridgeSource,
    provider_bridge_authorizes_candidate: bridgeAuthorizesCandidate,
    authority_matches_current_turn: authorityMatchesCurrentTurn,
    presentation_matches_current_turn: presentationMatchesCurrentTurn,
    authority_shape_valid: authorityShapeValid,
    presentation_shape_valid: presentationShapeValid,
    authority_ref_current_turn_scoped: authorityRefCurrentTurnScoped,
    usable_text_present: usableTextPresent,
    support_refs_required: supportRefsRequired,
    requested_support_ref_count: requestedSupportRefs.length,
    current_turn_support_ref_count: currentTurnSupportRefCount,
    rejection_reason: rejectionReason,
  };
};

const artifactText = (artifact: HelixTerminalProductArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  const record = artifact as Record<string, unknown>;
  return (
    readString(payload?.answer_text) ??
    readString(payload?.text) ??
    readString(payload?.summary) ??
    readString(payload?.result_summary) ??
    readString(payload?.result_text) ??
    readString(payload?.visible_text) ??
    readString(payload?.message) ??
    readString(record.answer_text) ??
    readString(record.text) ??
    readString(record.summary) ??
    readString(record.result_summary) ??
    readString(record.result_text) ??
    readString(record.visible_text) ??
    readString(record.message) ??
    readString(record.text_preview)
  );
};

const artifactFieldString = (
  artifact: HelixTerminalProductArtifactLike,
  field: string,
): string | null => {
  const payload = artifactPayload(artifact);
  return (
    readString(payload?.[field]) ??
    readString((artifact as Record<string, unknown>)[field])
  );
};

const isDirectAnswerTextArtifact = (artifact: HelixTerminalProductArtifactLike): boolean =>
  artifactKind(artifact) === "direct_answer_text" ||
  artifactSchema(artifact) === "helix.direct_answer_text.v1";

const artifactMatchesObservationKind = (
  artifact: HelixTerminalProductArtifactLike,
  pattern: RegExp,
): boolean => {
  const payload = artifactPayload(artifact);
  const haystack = [
    artifactKind(artifact),
    artifactSchema(artifact),
    readString(payload?.kind),
    readString(payload?.schema),
    readString(payload?.capability),
    readString(payload?.capability_key),
    readString(payload?.tool_name),
    readString(payload?.action),
    readString(payload?.action_id),
    readString(payload?.requested_capability),
    readString(payload?.selected_capability),
  ].filter(Boolean).join(" ");
  return pattern.test(haystack);
};

const isMoralGraphObservationArtifact = (artifact: HelixTerminalProductArtifactLike): boolean =>
  artifactMatchesObservationKind(
    artifact,
    /moral_graph_reflection|moral-graph\.reflect_context|helix\.moral_graph_reflection_observation\.v1|ideology_context_reflection|procedural_moral_classification/i,
  );

const payloadRequiresMoralGraphProviderTerminal = (payload: Record<string, unknown>): boolean => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeSourceTargetIntent = readRecord(readRecord(payload.route_metadata)?.source_target_intent);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  const values = [
    readString(canonicalGoal?.requested_capability),
    readString(canonicalGoal?.selected_capability),
    readString(canonicalGoal?.source_target),
    readString(canonicalGoal?.target_source),
    readString(canonicalGoal?.target_kind),
    readString(sourceTargetIntent?.selected_capability),
    readString(sourceTargetIntent?.requested_capability),
    readString(sourceTargetIntent?.target_source),
    readString(sourceTargetIntent?.target_kind),
    readString(routeSourceTargetIntent?.selected_capability),
    readString(routeSourceTargetIntent?.requested_capability),
    readString(routeSourceTargetIntent?.target_source),
    readString(routeSourceTargetIntent?.target_kind),
  ].filter((entry): entry is string => Boolean(entry));
  return (
    requiredTerminalKind === "agent_provider_terminal_candidate" &&
    values.some((value) => /moral[-_]graph|moral_graph_reflection|moral-graph\.reflect_context/i.test(value))
  );
};

export const filterProviderTerminalSupportRefsForMoralGraph = (input: {
  payload: Record<string, unknown>;
  artifactLedger?: HelixTerminalProductArtifactLike[] | null;
  supportRefs: string[];
}): { required: boolean; supportRefs: string[]; rejectedSupportRefs: string[] } => {
  const supportRefs = uniqueStrings(input.supportRefs);
  if (!payloadRequiresMoralGraphProviderTerminal(input.payload)) {
    return { required: false, supportRefs, rejectedSupportRefs: [] };
  }
  const artifactLedger = input.artifactLedger ?? [];
  const moralSupportRefs = supportRefs.filter((ref) => {
    if (/moral_graph_reflection|moral-graph\.reflect_context|ideology_context_reflection|procedural_moral_classification/i.test(ref)) {
      return true;
    }
    return artifactLedger.some((artifact) => artifactId(artifact) === ref && isMoralGraphObservationArtifact(artifact));
  });
  return {
    required: true,
    supportRefs: uniqueStrings(moralSupportRefs),
    rejectedSupportRefs: supportRefs.filter((ref) => !moralSupportRefs.includes(ref)),
  };
};

const imageLensRegionInspectionRecord = (value: unknown): Record<string, unknown> | null => {
  const record = readRecord(value);
  if (!record) return null;
  const capability = [
    record.capability,
    record.capability_id,
    record.capability_key,
    record.capabilityId,
    record.tool_name,
    record.action,
    record.action_id,
    record.requested_capability,
    record.selected_capability,
  ].map(readString).filter(Boolean).join(" ");
  const kind = [record.kind, record.schema, record.target_kind].map(readString).filter(Boolean).join(" ");
  if (
    /visual_analysis\.inspect_image_region|inspect_image_region|image_lens|image-lens|scientific_image_evidence_sidecar/i.test(capability) ||
    /capability_lane_observation_packet|scientific_image_evidence_sidecar|image_lens/i.test(kind)
  ) {
    return record;
  }
  return null;
};

const collectImageLensTerminalRecords = (
  payload: Record<string, unknown>,
  artifacts: HelixTerminalProductArtifactLike[] | null | undefined,
): Record<string, unknown>[] => {
  const debug = readRecord(payload.debug);
  const candidates: unknown[] = [
    payload.image_lens_observation_report,
    payload.scientific_image_evidence_sidecar,
    payload.terminal_presentation,
    ...readArray(payload.capability_lane_call_results),
    ...readArray(debug?.capability_lane_call_results),
    ...readArray(payload.capability_lane_observation_packets),
    ...readArray(debug?.capability_lane_observation_packets),
    ...readArray(payload.workstation_gateway_call_results),
    ...readArray(debug?.workstation_gateway_call_results),
    ...readArray(payload.current_turn_artifact_ledger),
    ...(artifacts ?? []),
  ];
  const records: Record<string, unknown>[] = [];
  for (const candidate of candidates) {
    const record = imageLensRegionInspectionRecord(candidate);
    if (record) records.push(record);
    const candidateRecord = readRecord(candidate);
    const payloadRecord = readRecord(candidateRecord?.payload);
    if (payloadRecord) {
      const payloadMatch = imageLensRegionInspectionRecord(payloadRecord);
      if (payloadMatch) records.push(payloadRecord);
    }
    const receipt = readRecord(candidateRecord?.receipt);
    if (receipt) records.push(receipt);
    const observation = readRecord(candidateRecord?.observation);
    if (observation) records.push(observation);
    const observationPacket = readRecord(candidateRecord?.observation_packet);
    if (observationPacket) records.push(observationPacket);
  }
  return records;
};

const readNestedRecordByKeys = (
  value: unknown,
  keys: string[],
  depth = 0,
): Record<string, unknown> | null => {
  if (depth > 4) return null;
  const record = readRecord(value);
  if (!record) {
    for (const item of readArray(value)) {
      const found = readNestedRecordByKeys(item, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const key of keys) {
    const nested = readRecord(record[key]);
    if (nested) return nested;
  }
  for (const nestedValue of Object.values(record)) {
    const found = readNestedRecordByKeys(nestedValue, keys, depth + 1);
    if (found) return found;
  }
  return null;
};

const readNestedStringByKeys = (
  value: unknown,
  keys: string[],
  depth = 0,
): string | null => {
  if (depth > 4) return null;
  const record = readRecord(value);
  if (!record) {
    for (const item of readArray(value)) {
      const found = readNestedStringByKeys(item, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const key of keys) {
    const text = readString(record[key]);
    if (text) return text;
  }
  for (const nestedValue of Object.values(record)) {
    const found = readNestedStringByKeys(nestedValue, keys, depth + 1);
    if (found) return found;
  }
  return null;
};

const formatImageLensBbox = (bbox: Record<string, unknown> | null): string | null => {
  if (!bbox) return null;
  const x = Number(bbox.x);
  const y = Number(bbox.y);
  const width = Number(bbox.width);
  const height = Number(bbox.height);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return `x=${x}, y=${y}, width=${width}, height=${height}`;
};

const materializeImageLensObservationReportFromCurrentTurn = (input: {
  payload: Record<string, unknown>;
  artifacts: HelixTerminalProductArtifactLike[] | null | undefined;
  routeAllowsTerminalKind: (kind: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  if (!input.routeAllowsTerminalKind("image_lens_observation_report")) return null;
  const records = collectImageLensTerminalRecords(input.payload, input.artifacts);
  if (records.length === 0) return null;

  const source = records.find((record) =>
    Boolean(
      readNestedStringByKeys(record, ["latex_candidate", "text_candidate", "ocr_text_candidate", "extraction_status"]) ||
      readNestedRecordByKeys(record, ["bbox_px", "bboxPx", "bbox"]),
    ),
  ) ?? records[0];
  const regionLabel =
    readNestedStringByKeys(source, ["region_label", "regionLabel", "label", "name"]) ??
    readNestedStringByKeys(input.payload, ["region_label", "regionLabel"]) ??
    "image_lens_region";
  const bbox = formatImageLensBbox(readNestedRecordByKeys(source, ["bbox_px", "bboxPx", "bbox"]));
  const cropRef = readNestedStringByKeys(source, ["crop_ref", "cropRef", "crop_region_id", "cropRegionId", "ref_hash"]);
  const extractionStatus = readNestedStringByKeys(source, ["extraction_status"]);
  const observationStatus = extractionStatus ? null : readNestedStringByKeys(source, ["status"]);
  const labelMatch = readNestedStringByKeys(source, ["label_match_status", "label_match"]);
  const exactAdmissibility = readNestedStringByKeys(source, ["exact_equation_admissibility"]);
  const exactRowPromotion = readNestedRecordByKeys(source, ["exact_row_promotion"]);
  const promotionStatus =
    readString(exactRowPromotion?.status) ??
    readNestedStringByKeys(source, ["promotion_status", "exact_row_promotion_status"]);
  const latexCandidate = readNestedStringByKeys(source, ["latex_candidate"]);
  const textCandidate = readNestedStringByKeys(source, ["text_candidate", "ocr_text_candidate"]);
  const uncertainty = readNestedStringByKeys(source, ["uncertainty", "uncertainty_text"]);
  const sourceRef =
    readNestedStringByKeys(source, ["artifact_id", "ref", "ref_id", "receipt_ref", "sidecar_id", "crop_ref", "cropRef"]) ??
    readString(input.payload.terminal_artifact_id) ??
    readString(readRecord(input.payload.terminal_answer_authority)?.terminal_item_id);

  const candidateBlocks = [
    textCandidate ? ["- text_candidate:", "```text", textCandidate, "```"].join("\n") : null,
    latexCandidate ? ["- latex_candidate:", "```latex", latexCandidate, "```"].join("\n") : null,
  ].filter((entry): entry is string => Boolean(entry));
  const compactObservationOnly = !bbox && !cropRef && !extractionStatus && !latexCandidate && !textCandidate;
  const text = [
    "The runtime provider echoed Helix internal capability instructions after Image Lens observations re-entered, so I am using only the observation receipts below and not the echoed provider text.",
    "",
    `**${regionLabel}**`,
    compactObservationOnly ? "- Observation status: Image Lens observation packet was produced, but the compact artifact did not include OCR/crop detail fields for terminal presentation." : null,
    sourceRef ? `- Observation ref: ${sourceRef}` : null,
    observationStatus ? `- Observation packet status: ${observationStatus}` : null,
    bbox ? `- Bbox: ${bbox}` : null,
    cropRef ? `- Crop ref: ${cropRef}` : null,
    extractionStatus ? `- Extraction status: ${extractionStatus}` : null,
    labelMatch ? `- Label match: ${labelMatch}` : null,
    exactAdmissibility ? `- Exact equation admissibility: ${exactAdmissibility}` : null,
    promotionStatus ? `- Exact row promotion: ${promotionStatus}` : null,
    candidateBlocks.length > 0
      ? ["- Extracted information:", ...candidateBlocks].join("\n")
      : "- Extracted information: no text_candidate or latex_candidate was returned for this crop",
    `- Uncertainty: ${uncertainty ?? "none returned"}`,
  ].filter(Boolean).join("\n");

  return withOutputRole({
    kind: "image_lens_observation_report",
    text,
    ref:
      readString(input.payload.terminal_artifact_id) ??
      readString(readRecord(input.payload.terminal_answer_authority)?.terminal_item_id) ??
      sourceRef ??
      null,
  });
};

export const materializeImageLensObservationReportTerminal = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  if (
    readString(input.payload.terminal_artifact_kind) === "image_lens_observation_report" &&
    readString(input.payload.final_answer_source) === "provider_image_lens_observation_report" &&
    input.routeAllowsTerminalKind("image_lens_observation_report")
  ) {
    const text =
      readString(input.payload.selected_final_answer) ??
      readString(input.payload.answer) ??
      readString(input.payload.text) ??
      readString(readRecord(input.payload.terminal_presentation)?.concise_text);
    if (text && !input.invalidText?.(text)) {
      return withOutputRole({
        kind: "image_lens_observation_report",
        text,
        ref:
          readString(input.payload.terminal_artifact_id) ??
          readString(readRecord(input.payload.terminal_answer_authority)?.terminal_item_id) ??
          null,
      });
    }
  }
  return materializeImageLensObservationReportFromCurrentTurn(input);
};

export const materializeDirectAnswerTextTerminal = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  if (!input.routeAllowsTerminalKind("direct_answer_text")) return null;

  const artifacts = input.artifacts ?? [];
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isDirectAnswerTextArtifact(artifact)) continue;
    const text = artifactText(artifact);
    if (!text || input.invalidText?.(text)) continue;
    return {
      kind: "direct_answer_text",
      text,
      ref: artifactId(artifact),
    };
  }

  const directAnswer = readRecord(input.payload.direct_answer_text);
  const text = readString(directAnswer?.answer_text) ?? readString(directAnswer?.text);
  if (!text || input.invalidText?.(text)) return null;
  return {
    kind: "direct_answer_text",
    text,
    ref: readString(directAnswer?.artifact_id),
  };
};

export const materializeAgentProviderTerminalCandidate = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  if (!input.routeAllowsTerminalKind("agent_provider_terminal_candidate")) return null;

  const authority = readRecord(input.payload.terminal_answer_authority);
  const presentation = readRecord(input.payload.terminal_presentation);
  const debug = readRecord(input.payload.debug);
  const candidate =
    readRecord(input.payload.provider_terminal_candidate) ??
    readRecord(debug?.provider_terminal_candidate);
  if (
    readString(authority?.terminal_kind) !== "answer" ||
    readString(authority?.terminal_artifact_kind) !== "agent_provider_terminal_candidate" ||
    readString(authority?.final_answer_source) !== "agent_provider_terminal_candidate" ||
    authority?.server_authoritative !== true
  ) {
    return null;
  }

  const text =
    readString(presentation?.concise_text) ??
    readString(candidate?.candidate_text) ??
    readString(candidate?.candidate_text_preview) ??
    readString(input.payload.selected_final_answer) ??
    readString(input.payload.answer) ??
    readString(input.payload.text);
  if (!text || input.invalidText?.(text)) return null;

  const ref =
    readString(authority?.terminal_item_id) ??
    readString(authority?.terminal_artifact_ref) ??
    readString(candidate?.candidate_id);
  if (!ref) return null;

  const supportRefSelection = filterProviderTerminalSupportRefsForMoralGraph({
    payload: input.payload,
    artifactLedger: input.artifacts,
    supportRefs: uniqueStrings([
      ...readArray(candidate?.grounded_in_observation_refs).map(readString),
      ...readArray(candidate?.normalized_observation_refs).map(readString),
      ...readArray(presentation?.selected_observation_refs).map(readString),
    ]),
  });
  if (supportRefSelection.required && supportRefSelection.supportRefs.length === 0) return null;

  return {
    kind: "agent_provider_terminal_candidate",
    text,
    ref,
    supportRefs: supportRefSelection.supportRefs,
    rejectedSupportRefs: supportRefSelection.rejectedSupportRefs,
  };
};

export const materializeAgentProviderRouteProductTerminal = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  turnId: string;
  requiredTerminalKind: string | null | undefined;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  const targetKind = readString(input.requiredTerminalKind);
  if (
    !targetKind ||
    !PROVIDER_AUTHORED_ROUTE_PRODUCT_KINDS.has(targetKind) ||
    !input.routeAllowsTerminalKind(targetKind)
  ) {
    return null;
  }

  const topLevelAuthority = readRecord(input.payload.terminal_answer_authority);
  const topLevelPresentation = readRecord(input.payload.terminal_presentation);
  const persistedProviderBridge = (input.artifacts ?? [])
    .slice()
    .reverse()
    .map((artifact) => ({ artifact, payload: artifactPayload(artifact) }))
    .find(({ artifact, payload }) =>
      artifactKind(artifact) === "provider_terminal_authority_bridge" &&
      readString(payload?.turn_id) === input.turnId,
    )?.payload ?? null;
  const providerBridge =
    readRecord(input.payload.provider_terminal_authority_bridge) ??
    persistedProviderBridge;
  const bridgeAuthority = readRecord(providerBridge?.terminal_answer_authority);
  const bridgePresentation = readRecord(providerBridge?.terminal_presentation);
  // A later writer pass can replace mutable top-level fields with a typed
  // failure. A matching bridge is retained only when it explicitly records a
  // current-turn provider authorization.
  const bridgeAuthorizesCandidate =
    readString(providerBridge?.turn_id) === input.turnId &&
    providerBridge?.terminal_authority_granted === true &&
    providerBridge?.final_visible_answer_authorized === true;
  const authority = bridgeAuthorizesCandidate ? bridgeAuthority ?? topLevelAuthority : topLevelAuthority;
  const presentation = bridgeAuthorizesCandidate ? bridgePresentation ?? topLevelPresentation : topLevelPresentation;
  const debug = readRecord(input.payload.debug);
  const candidate =
    readRecord(input.payload.provider_terminal_candidate) ??
    readRecord(debug?.provider_terminal_candidate) ??
    readRecord(providerBridge?.provider_terminal_candidate);
  const authorityRef =
    readString(authority?.terminal_item_id) ??
    readString(authority?.terminal_artifact_ref) ??
    readString(candidate?.candidate_id);
  if (
    readString(authority?.turn_id) !== input.turnId ||
    readString(presentation?.turn_id) !== input.turnId ||
    readString(authority?.terminal_kind) !== "answer" ||
    readString(authority?.terminal_artifact_kind) !== "agent_provider_terminal_candidate" ||
    readString(authority?.final_answer_source) !== "agent_provider_terminal_candidate" ||
    readString(presentation?.final_answer_source) !== "agent_provider_terminal_candidate" ||
    authority?.server_authoritative !== true ||
    !authorityRef?.startsWith(`${input.turnId}:`)
  ) {
    return null;
  }

  const presentationText = readString(presentation?.concise_text);
  const candidateText =
    readString(candidate?.candidate_text) ??
    readString(candidate?.candidate_text_preview);
  const text =
    (presentationText && !input.invalidText?.(presentationText) ? presentationText : null) ??
    candidateText ??
    readString(input.payload.selected_final_answer) ??
    readString(input.payload.answer) ??
    readString(input.payload.text);
  if (!text || input.invalidText?.(text)) return null;

  const artifactLedger = input.artifacts ?? [];
  const currentTurnArtifactRefs = new Set(
    artifactLedger
      .filter((artifact) => {
        const payload = artifactPayload(artifact);
        const sourceScope = artifactFieldString(artifact, "source_scope");
        const artifactTurnId = readString(payload?.turn_id);
        return (
          !/prior_context|prior_turn_context|prior_artifact/i.test(sourceScope ?? "") &&
          (!artifactTurnId || artifactTurnId === input.turnId)
        );
      })
      .map(artifactId)
      .filter((ref): ref is string => Boolean(ref)),
  );
  const requestedSupportRefs = uniqueStrings([
    ...readArray(presentation?.selected_observation_refs).map(readString),
    ...readArray(candidate?.grounded_in_observation_refs).map(readString),
    ...readArray(candidate?.normalized_observation_refs).map(readString),
  ]);
  const supportRefs = requestedSupportRefs.filter((ref) => currentTurnArtifactRefs.has(ref));
  if (providerTerminalSupportRefsRequired(providerBridge, candidate) && supportRefs.length === 0) return null;

  const rejectedSupportRefs = requestedSupportRefs.filter((ref) => !currentTurnArtifactRefs.has(ref));
  const artifactRef = `${authorityRef}:route_product:${targetKind}`;
  const targetSchema = targetKind === "direct_answer_text"
    ? "helix.direct_answer_text.v1"
    : targetKind === "compound_evidence_synthesis_answer"
    ? "helix.compound_evidence_synthesis_answer.v1"
    : targetKind === "compound_research_locator_answer"
      ? "helix.compound_research_locator_answer.v1"
      : targetKind === "doc_evidence_synthesis_answer"
        ? "helix.doc_evidence_synthesis_answer.v1"
        : targetKind === "repo_code_evidence_answer"
          ? "helix.repo_code_evidence_answer.v1"
          : targetKind === "scholarly_research_answer"
            ? "helix.scholarly_research_answer.v1"
            : targetKind === "internet_search_answer"
              ? "helix.internet_search_answer.v1"
              : targetKind === "capability_help_summary"
                ? "helix.capability_help_summary.v1"
                : targetKind === "workspace_status_answer"
                  ? "helix.workspace_status_answer.v1"
                  : targetKind === "workstation_tool_evaluation"
                    ? "helix.workstation_tool_evaluation.v1"
                  : targetKind === "theory_context_reflection_answer"
                    ? "helix.theory_context_reflection_answer.v1"
                    : "helix.provider_route_product.v1";
  const artifactPayloadRecord = {
    schema: targetSchema,
    artifact_id: artifactRef,
    turn_id: input.turnId,
    kind: targetKind,
    terminal_artifact_kind: targetKind,
    answer_text: text,
    text,
    support_refs: supportRefs,
    selected_observation_refs: supportRefs,
    provider_terminal_candidate_ref: authorityRef,
    provider_terminal_candidate_kind: "agent_provider_terminal_candidate",
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    kind: targetKind,
    text,
    ref: artifactRef,
    supportRefs,
    rejectedSupportRefs,
    artifact: {
      artifact_id: artifactRef,
      kind: targetKind,
      payload: artifactPayloadRecord,
    },
  };
};

const readSuccessfulCalculatorReceiptArtifact = (
  artifacts: HelixTerminalProductArtifactLike[] | null | undefined,
): {
  artifact: HelixTerminalProductArtifactLike;
  expression: string;
  result: string;
  normalizedExpression: string | null;
  ref: string | null;
} | null => {
  const ledger = artifacts ?? [];
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const artifact = ledger[index];
    if (!artifact) continue;
    const payload = artifactPayload(artifact);
    const kind = artifactKind(artifact);
    const schema = artifactSchema(artifact);
    const capability = readString(payload?.capability_key) ?? readString(payload?.source_capability_id);
    if (
      kind !== "calculator_receipt" &&
      schema !== "helix.calculator_receipt.v1" &&
      capability !== "scientific-calculator.solve_expression"
    ) {
      continue;
    }
    if (readString(payload?.status) && readString(payload?.status) !== "succeeded") continue;
    const expression = readString(payload?.expression);
    const result = readString(payload?.result) ?? readString(payload?.result_text) ?? readString(payload?.calculator_result);
    if (!expression || !result) continue;
    if (isPromptContaminatedCalculatorExpression(expression)) continue;
    return {
      artifact,
      expression,
      result,
      normalizedExpression: readString(payload?.normalized_expression),
      ref: artifactId(artifact),
    };
  }
  return null;
};

export const materializeCalculatorWorkstationToolEvaluationFromReceiptTerminal = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  turnId: string;
  routeAllowsTerminalKind: (kind: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  if (!input.routeAllowsTerminalKind("workstation_tool_evaluation")) return null;
  const receipt = readSuccessfulCalculatorReceiptArtifact(input.artifacts);
  if (!receipt) return null;
  const evaluationId = `${input.turnId}:workstation_tool_evaluation:calculator_receipt`;
  const text = [
    "Calculator verification plan completed.",
    `Expression: ${receipt.expression}`,
    `Result: ${receipt.result}`,
    "Trace source: scientific-calculator.solve_expression.",
  ].join("\n");
  const evaluation = {
    schema: "helix.workstation_tool_evaluation.v1",
    evaluation_id: evaluationId,
    turn_id: input.turnId,
    supports_goal: true,
    source: "calculator_receipt_materialization",
    source_capability: "scientific-calculator.solve_expression",
    source_receipt_ref: receipt.ref,
    expression: receipt.expression,
    normalized_expression: receipt.normalizedExpression ?? receipt.expression,
    result_text: receipt.result,
    calculator_result: receipt.result,
    summary: text,
    answer_text: text,
    text,
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return withOutputRole({
    kind: "workstation_tool_evaluation",
    text,
    ref: evaluationId,
    artifact: {
      artifact_id: evaluationId,
      kind: "workstation_tool_evaluation",
      payload: evaluation,
    },
    supportRefs: uniqueStrings([receipt.ref, evaluationId]),
  });
};

export const materializeTheoryContextReflectionTerminal = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  turnId: string;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
  scientificGuard?: unknown | null;
  applyScientificGuardToText?: (text: string, guard: unknown | null) => string;
  synthesizeText: (input: {
    prompt: string | null;
    evaluationSummary: string | null;
    receiptText: string | null;
    scientificGuard?: unknown | null;
  }) => string;
  prompt?: string | null;
}): HelixTerminalProductMaterializerResult | null => {
  if (!input.routeAllowsTerminalKind("theory_context_reflection_answer")) return null;

  const artifacts = input.artifacts ?? [];
  const existingCandidates = [
    readRecord(input.payload.theory_context_reflection_answer),
    ...artifacts
      .filter((artifact) => artifactKind(artifact) === "theory_context_reflection_answer")
      .map(artifactPayload),
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry));
  for (const candidate of existingCandidates) {
    const text = readString(candidate.answer_text) ?? readString(candidate.text);
    if (!text || input.invalidText?.(text)) continue;
    const guardedText = input.applyScientificGuardToText
      ? input.applyScientificGuardToText(text, input.scientificGuard ?? null)
      : text;
    const ref = readString(candidate.artifact_id) ?? `${input.turnId}:theory_context_reflection_answer`;
    const payload = {
      ...candidate,
      artifact_id: ref,
      text: guardedText,
      answer_text: guardedText,
      scientific_final_answer_guard: input.scientificGuard ?? candidate.scientific_final_answer_guard,
    };
    return {
      kind: "theory_context_reflection_answer",
      text: guardedText,
      ref,
      artifact: {
        artifact_id: ref,
        kind: "theory_context_reflection_answer",
        payload,
      },
      supportRefs: uniqueStrings(readArray(payload.support_refs).map(readString)),
    };
  }

  const receipt = [...artifacts].reverse().find((artifact) =>
    artifactKind(artifact) === "helix_theory_context_reflection_tool_receipt" &&
    artifactObservationSucceeded(artifact)
  );
  const supportObservation = [...artifacts].reverse().find((artifact) => {
    if (!artifactObservationSucceeded(artifact)) return false;
    const kind = artifactKind(artifact);
    const payload = artifactPayload(artifact);
    const topLevel = artifact as Record<string, unknown>;
    const haystack = [
      kind,
      artifactFieldString(artifact, "schema"),
      artifactFieldString(artifact, "payload_schema"),
      artifactFieldString(artifact, "capability_id"),
      artifactFieldString(artifact, "capability_key"),
      artifactFieldString(artifact, "requested_capability"),
      artifactFieldString(artifact, "selected_capability"),
      artifactFieldString(artifact, "tool_name"),
      artifactFieldString(artifact, "action"),
      readString(payload?.observation_kind),
      readString(readRecord(payload?.observation)?.kind),
      readString(readRecord(payload?.observation)?.capability_key),
      readString(readRecord(payload?.observation)?.capability_id),
      readString(topLevel.observation_kind),
      readString(readRecord(topLevel.observation)?.kind),
      readString(readRecord(topLevel.observation)?.capability_key),
      readString(readRecord(topLevel.observation)?.capability_id),
      JSON.stringify(payload ?? {}),
    ].filter(Boolean).join(" ");
    if (
      kind === "workstation_tool_evaluation" &&
      /theory_context_reflection|reflect_theory_context|supports_subgoal|theory-badge-graph\.reflect_discussion_context/i.test(haystack)
    ) {
      return true;
    }
    return (
      kind === "provider_gateway_observation_packet" &&
      /theory-badge-graph\.reflect_discussion_context|helix_theory_context_reflection_tool_receipt|theory_context_reflection/i.test(haystack)
    );
  });
  if (!receipt || !supportObservation) return null;

  const receiptRef = artifactId(receipt);
  const supportObservationRef =
    artifactId(supportObservation) ??
    readString(artifactPayload(supportObservation)?.evaluation_id);
  const supportRefs = uniqueStrings([receiptRef, supportObservationRef]);
  if (supportRefs.length < 2) return null;

  const text = input.synthesizeText({
    prompt: input.prompt ?? null,
    evaluationSummary: artifactText(supportObservation),
    receiptText: artifactText(receipt),
    scientificGuard: input.scientificGuard ?? null,
  });
  if (!text || input.invalidText?.(text)) return null;

  const ref = `${input.turnId}:theory_context_reflection_answer:from_reflection_observation`;
  const terminalPayload = {
    schema: "helix.theory_context_reflection_answer.v1",
    artifact_id: ref,
    turn_id: input.turnId,
    text,
    answer_text: text,
    support_refs: supportRefs,
    support_refs_count: supportRefs.length,
    subgoal_observation_refs: supportRefs,
    subgoal_observation_refs_count: supportRefs.length,
    source_families: ["theory_locator"],
    scientific_final_answer_guard: input.scientificGuard ?? null,
    model_authored: false,
    synthesis_mode: "deterministic_theory_reflection_materializer",
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    kind: "theory_context_reflection_answer",
    text,
    ref,
    supportRefs,
    artifact: {
      artifact_id: ref,
      kind: "theory_context_reflection_answer",
      payload: terminalPayload,
    },
  };
};

export const materializePostulateRuntimeReviewTerminal = (input: {
  turnId: string;
  finalText: string;
  review: unknown | null;
  gate: unknown;
  proposal?: unknown | null;
  score?: unknown | null;
  receiptId?: string | null;
  boardPublished?: boolean;
  hydratedEvidenceContext?: {
    evidenceSidecarRefs?: string[];
    promotedEquationRowRefs?: string[];
    pageRenderRefs?: string[];
    cropRefs?: string[];
    graphReflectionRefs?: string[];
    calculatorCheckRefs?: string[];
  } | null;
  existingTerminalPresentation?: Record<string, unknown> | null;
  existingDebug?: Record<string, unknown> | null;
  routeAllowsTerminalKind: (kind: string) => boolean;
  executableOperatorCommands?: string[];
}): HelixPostulateRuntimeReviewTerminal | null => {
  if (!input.routeAllowsTerminalKind("postulate_runtime_review")) return null;
  const finalText = readString(input.finalText);
  if (!finalText) return null;
  const proposalRecord = readRecord(input.proposal);
  const proposalId = readString(proposalRecord?.id);
  const terminalArtifactId = proposalId ?? input.turnId;
  const hydrated = input.hydratedEvidenceContext ?? {};
  const terminalResult = {
    schema: "helix.ask.postulate_review_result.v1",
    runtimeReview: input.review ?? null,
    submissionGate: input.gate,
    proposal: input.proposal ?? null,
    score: input.score ?? null,
    receiptId: input.receiptId ?? null,
    boardPublished: input.boardPublished === true,
    claimBoundary: "accepted means constructive review candidate, not proof or certification",
  };
  const terminalPresentation = {
    ...(input.existingTerminalPresentation ?? {}),
    schema: "helix.terminal_presentation.v1",
    presentation_id: `terminal_presentation:${input.turnId}:postulate_runtime_review`,
    concise_text: finalText,
    selected_final_answer: finalText,
    visible_final_answer: finalText,
    terminal_artifact_kind: "postulate_runtime_review",
    final_answer_source: "postulate_runtime_review",
    terminal_authority_status: "selected",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const artifactPayload = {
    schema: "helix.postulate_runtime_review.v1",
    artifact_id: terminalArtifactId,
    turn_id: input.turnId,
    text: finalText,
    answer_text: finalText,
    terminal_result: terminalResult,
    terminal_presentation: terminalPresentation,
    assistant_answer: false,
    terminal_eligible: true,
    raw_content_included: false,
  };
  return {
    text: finalText,
    terminalResult,
    terminalPresentation,
    terminalArtifactId,
    artifact: {
      artifact_id: terminalArtifactId,
      kind: "postulate_runtime_review",
      payload: artifactPayload,
    },
    debugPatch: {
      postulate_review_result: terminalResult,
      postulate_evidence_hydration: {
        schema: "helix.ask.postulate_evidence_hydration.v1",
        status: (hydrated.evidenceSidecarRefs ?? []).length > 0 ? "hydrated" : "missing",
        evidence_sidecar_refs: hydrated.evidenceSidecarRefs ?? [],
        promoted_equation_row_refs: hydrated.promotedEquationRowRefs ?? [],
        page_render_refs: hydrated.pageRenderRefs ?? [],
        crop_refs: hydrated.cropRefs ?? [],
        graph_reflection_refs: hydrated.graphReflectionRefs ?? [],
        calculator_check_refs: hydrated.calculatorCheckRefs ?? [],
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        ...(readRecord(input.existingDebug?.ask_turn_solver_trace) ?? {}),
        schema: "helix.ask_turn_solver_trace.v1",
        turn_id: input.turnId,
        completed_solver_path: true,
        terminal_authority_ok: true,
        prompt_interpretation: {
          command: "/postulate",
          executable_operator_commands: input.executableOperatorCommands ?? [],
        },
      },
    },
  };
};

export const materializePostulateRuntimeReviewCandidateTerminal = (input: {
  payload: Record<string, unknown>;
  artifacts?: HelixTerminalProductArtifactLike[] | null;
  routeAllowsTerminalKind: (kind: string) => boolean;
  invalidText?: (text: string) => boolean;
}): HelixTerminalProductMaterializerResult | null => {
  if (!input.routeAllowsTerminalKind("postulate_runtime_review")) return null;
  const artifacts = input.artifacts ?? [];
  const candidates = [
    readRecord(input.payload.postulate_runtime_review),
    ...artifacts
      .filter((artifact) => artifactKind(artifact) === "postulate_runtime_review")
      .map(artifactPayload),
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry));
  for (const candidate of candidates) {
    const text =
      readString(candidate.answer_text) ??
      readString(candidate.text) ??
      readString(readRecord(candidate.terminal_presentation)?.concise_text);
    if (!text || input.invalidText?.(text)) continue;
    const ref = readString(candidate.artifact_id) ?? readString(candidate.proposal_id) ?? null;
    return {
      kind: "postulate_runtime_review",
      text,
      ref,
      artifact: {
        artifact_id: ref ?? undefined,
        kind: "postulate_runtime_review",
        payload: candidate,
      },
      supportRefs: uniqueStrings([
        ...readArray(readRecord(candidate.terminal_result)?.support_refs).map(readString),
        ...readArray(candidate.support_refs).map(readString),
      ]),
    };
  }
  return null;
};
