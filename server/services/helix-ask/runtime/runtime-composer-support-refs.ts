type RecordLike = Record<string, unknown>;

export type HelixRuntimeComposerSupportRefArtifact = {
  kind: string;
  artifact_id: string;
  payload?: unknown;
};

const readComposerSupportRefString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readComposerSupportRefPayloadRecord = (
  artifact: HelixRuntimeComposerSupportRefArtifact,
): RecordLike | null =>
  artifact.payload && typeof artifact.payload === "object" && !Array.isArray(artifact.payload)
    ? (artifact.payload as RecordLike)
    : null;

export const collectHelixRuntimeComposerScholarlyObservationRefs = (
  artifacts: HelixRuntimeComposerSupportRefArtifact[],
): string[] =>
  artifacts
    .filter((artifact) => artifact.kind === "scholarly_research_observation" || artifact.kind === "scholarly_full_text_observation")
    .map((artifact) => artifact.artifact_id)
    .filter(Boolean);

export const collectHelixRuntimeComposerScholarlySupportRefs = (
  artifacts: HelixRuntimeComposerSupportRefArtifact[],
): string[] => {
  const refs = new Set<string>();
  for (const artifact of artifacts) {
    if (artifact.kind !== "scholarly_research_observation" && artifact.kind !== "scholarly_full_text_observation") continue;
    refs.add(artifact.artifact_id);
    const payload = readComposerSupportRefPayloadRecord(artifact);
    if (!payload) continue;
    if (Array.isArray(payload.evidence_refs)) {
      for (const ref of payload.evidence_refs) {
        const text = readComposerSupportRefString(ref);
        if (text) refs.add(text);
      }
    }
    if (Array.isArray(payload.page_text_refs)) {
      for (const pageRef of payload.page_text_refs) {
        const record = pageRef && typeof pageRef === "object" && !Array.isArray(pageRef)
          ? (pageRef as RecordLike)
          : null;
        const text = readComposerSupportRefString(record?.text_ref) ?? readComposerSupportRefString(pageRef);
        if (text) refs.add(text);
      }
    }
    if (Array.isArray(payload.selected_chunks)) {
      for (const chunk of payload.selected_chunks) {
        const record = chunk && typeof chunk === "object" && !Array.isArray(chunk)
          ? (chunk as RecordLike)
          : null;
        for (const ref of [
          readComposerSupportRefString(record?.chunk_ref),
          readComposerSupportRefString(record?.source_text_ref),
          readComposerSupportRefString(record?.citation_ref),
        ]) {
          if (ref) refs.add(ref);
        }
      }
    }
  }
  return Array.from(refs).slice(0, 16);
};

export const collectHelixRuntimeComposerInternetSearchObservationRefs = (
  artifacts: HelixRuntimeComposerSupportRefArtifact[],
): string[] =>
  artifacts
    .filter((artifact) => artifact.kind === "internet_search_observation")
    .map((artifact) => artifact.artifact_id)
    .filter(Boolean);

export const collectHelixRuntimeComposerInternetSearchSupportRefs = (
  artifacts: HelixRuntimeComposerSupportRefArtifact[],
): string[] => {
  const refs = new Set<string>();
  for (const artifact of artifacts) {
    if (artifact.kind !== "internet_search_observation") continue;
    refs.add(artifact.artifact_id);
    const payload = readComposerSupportRefPayloadRecord(artifact);
    if (!payload) continue;
    if (Array.isArray(payload.evidence_refs)) {
      for (const ref of payload.evidence_refs) {
        const text = readComposerSupportRefString(ref);
        if (text) refs.add(text);
      }
    }
    if (Array.isArray(payload.results)) {
      for (const result of payload.results) {
        const record = result && typeof result === "object" && !Array.isArray(result)
          ? (result as RecordLike)
          : null;
        for (const ref of [
          readComposerSupportRefString(record?.result_id),
          readComposerSupportRefString(record?.url),
          readComposerSupportRefString(record?.source_url),
          readComposerSupportRefString(record?.evidence_ref),
        ]) {
          if (ref) refs.add(ref);
        }
        if (Array.isArray(record?.evidence_refs)) {
          for (const ref of record.evidence_refs) {
            const text = readComposerSupportRefString(ref);
            if (text) refs.add(text);
          }
        }
      }
    }
  }
  return Array.from(refs).slice(0, 16);
};
