import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const gatewayCapability = (result: HelixWorkstationGatewayCallResult): string =>
  result.gateway_admission?.requested_capability || result.capability_id;

const scholarlyResultIds = (result: HelixWorkstationGatewayCallResult): string[] => {
  const observation = readRecord(result.observation);
  const papers = readArray(observation?.papers)
    .map(readRecord)
    .filter((paper): paper is Record<string, unknown> => Boolean(paper));
  const selectedChunks = readArray(observation?.selected_chunks)
    .map(readRecord)
    .filter((chunk): chunk is Record<string, unknown> => Boolean(chunk));
  return Array.from(new Set([
    readString(observation?.artifact_id),
    readString(observation?.paper_result_id),
    readString(observation?.result_id),
    ...papers.map((paper) => readString(paper.result_id)),
    ...selectedChunks.map((chunk) => readString(chunk.paper_result_id)),
  ].filter((entry): entry is string => Boolean(entry))));
};

export const scholarlyObservedResultIdsFromGatewayResults = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
): string[] => Array.from(new Set(
  gatewayCallResults
    .filter((result) => [
      "scholarly-research.lookup_papers",
      HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
    ].includes(gatewayCapability(result)))
    .flatMap(scholarlyResultIds),
));

const fullTextObservation = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown> | null => {
  if (gatewayCapability(result) !== HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY || result.ok !== true) {
    return null;
  }
  const observation = readRecord(result.observation);
  return observation &&
    readString(observation.evidence_state) === "full_text_usable" &&
    readArray(observation.selected_chunks).length > 0
    ? observation
    : null;
};

const fullTextObservationRefs = (
  result: HelixWorkstationGatewayCallResult,
  observation: Record<string, unknown>,
): string[] => Array.from(new Set([
  ...scholarlyResultIds(result),
  readString(observation.source_pdf_ref),
  readString(observation.source_url),
  readString(result.observation_packet?.observation_ref),
  ...readArray(result.artifact_refs).map(readString),
].filter((entry): entry is string => Boolean(entry))));

const fullTextObservationSourceKey = (
  observation: Record<string, unknown>,
): string | null =>
  readString(observation.cache_integrity_hash) ??
  readString(observation.source_pdf_ref) ??
  readString(observation.source_url) ??
  readString(observation.artifact_id);

const lookupPaperRecords = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown>[] => {
  if (gatewayCapability(result) !== HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY) return [];
  const observation = readRecord(result.observation);
  const evidenceState = readString(observation?.evidence_state);
  if (!observation || !["lookup_usable", "lookup_weak_match"].includes(evidenceState ?? "")) {
    return [];
  }
  return readArray(observation.papers)
    .map(readRecord)
    .filter((paper): paper is Record<string, unknown> => {
      if (!paper || !readString(paper.result_id) || !readString(paper.title)) return false;
      const identifiers = readRecord(paper.identifiers);
      return (
        readArray(paper.evidence_refs).some((entry) => Boolean(readString(entry))) ||
        Boolean(
          readString(identifiers?.doi) ??
          readString(identifiers?.arxiv_id) ??
          readString(identifiers?.pmid) ??
          readString(identifiers?.url) ??
          readString(identifiers?.pdf_url) ??
          readString(identifiers?.full_text_url),
        )
      );
    });
};

export const isRuntimeSelectedUsableScholarlyLookupResult = (input: {
  result: HelixWorkstationGatewayCallResult;
  selectedResultIds?: string[];
}): boolean => {
  if (!input.selectedResultIds?.length) return false;
  const selectedResultIdSet = new Set(input.selectedResultIds);
  return lookupPaperRecords(input.result).some((paper) =>
    selectedResultIdSet.has(readString(paper.result_id) ?? "")
  );
};

export const hasRuntimeSelectedUsableScholarlyLookupEvidence = (input: {
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  selectedResultIds?: string[];
}): boolean => {
  const selectedResultIds = Array.from(new Set(
    (input.selectedResultIds ?? []).map((entry) => entry.trim()).filter(Boolean),
  ));
  if (selectedResultIds.length === 0) return false;
  const observedPaperIds = new Set(
    input.gatewayCallResults
      .flatMap(lookupPaperRecords)
      .map((paper) => readString(paper.result_id))
      .filter((entry): entry is string => Boolean(entry)),
  );
  return selectedResultIds.every((resultId) => observedPaperIds.has(resultId));
};

export const isRuntimeSelectedUsableScholarlyFullTextResult = (input: {
  result: HelixWorkstationGatewayCallResult;
  selectedResultIds?: string[];
}): boolean => {
  const observation = fullTextObservation(input.result);
  if (!observation || !input.selectedResultIds?.length) return false;
  const selectedResultIdSet = new Set(input.selectedResultIds);
  return fullTextObservationRefs(input.result, observation).some((ref) =>
    selectedResultIdSet.has(ref)
  );
};

export const hasRuntimeSelectedUsableScholarlyFullTextEvidence = (input: {
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  selectedResultIds?: string[];
}): boolean => input.gatewayCallResults.some((result) =>
  isRuntimeSelectedUsableScholarlyFullTextResult({
    result,
    selectedResultIds: input.selectedResultIds,
  })
);

export const enrichScholarlyNumericArgumentsFromGatewayResults = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  argumentsRecord: Record<string, unknown>,
): Record<string, unknown> => {
  if (
    readRecord(argumentsRecord.full_text_observation ?? argumentsRecord.fullTextObservation) ||
    readString(argumentsRecord.text_evidence ?? argumentsRecord.textEvidence ?? argumentsRecord.text)
  ) {
    return argumentsRecord;
  }

  const usableFullTextResults = gatewayCallResults
    .map((result) => ({ result, observation: fullTextObservation(result) }))
    .filter((entry): entry is {
      result: HelixWorkstationGatewayCallResult;
      observation: Record<string, unknown>;
    } => Boolean(entry.observation));
  if (usableFullTextResults.length === 0) return argumentsRecord;

  const requestedSourceRef = readString(
    argumentsRecord.source_ref ??
    argumentsRecord.sourceRef ??
    argumentsRecord.paper_result_id ??
    argumentsRecord.paperResultId ??
    argumentsRecord.result_id ??
    argumentsRecord.resultId,
  );
  const sourceMatchedResults = requestedSourceRef
    ? usableFullTextResults.filter(({ result, observation }) =>
        fullTextObservationRefs(result, observation).includes(requestedSourceRef)
      )
    : [];
  const distinctSourceKeys = new Set(
    usableFullTextResults
      .map(({ observation }) => fullTextObservationSourceKey(observation))
      .filter((entry): entry is string => Boolean(entry)),
  );
  const selected = sourceMatchedResults.at(-1) ?? (
    !requestedSourceRef && distinctSourceKeys.size === 1
      ? usableFullTextResults.at(-1)
      : null
  );
  if (!selected) return argumentsRecord;

  const sourceRef =
    readString(selected.observation.artifact_id) ??
    readString(selected.result.observation_packet?.observation_ref) ??
    readString(selected.observation.source_pdf_ref) ??
    readString(selected.observation.source_url);
  return {
    ...argumentsRecord,
    full_text_observation: selected.observation,
    ...(sourceRef ? { source_ref: sourceRef } : {}),
  };
};
