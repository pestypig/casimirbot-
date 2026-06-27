export type HelixRuntimeComposerCollectorArtifact = {
  kind: string;
  artifact_id: string;
  payload?: unknown;
};

export type HelixRuntimeComposerArtifactCollectorDependencies = {
  readArtifactPayloadRecord: (artifact: HelixRuntimeComposerCollectorArtifact) => Record<string, unknown> | null;
  readString: (value: unknown) => string | null;
};

export const createHelixRuntimeComposerArtifactCollectors = (
  deps: HelixRuntimeComposerArtifactCollectorDependencies,
) => {
  const collectHelixRuntimeComposerReceipts = (
    artifacts: HelixRuntimeComposerCollectorArtifact[],
  ): Array<Record<string, unknown>> => {
    const byId = new Map<string, Record<string, unknown>>();
    for (const artifact of artifacts) {
      const payload = deps.readArtifactPayloadRecord(artifact);
      if (!payload) continue;
      const kind = deps.readString(payload.kind) ?? artifact.kind;
      const looksLikeReceipt =
        artifact.kind === "calculator_receipt" ||
        artifact.kind === "calculator_subgoal_receipt" ||
        /(?:^|_)receipt$/.test(artifact.kind) ||
        /(?:^|_)receipt$/.test(kind) ||
        Boolean(deps.readString(payload.receipt_id));
      if (!looksLikeReceipt) continue;
      const receiptId = deps.readString(payload.receipt_id) ?? deps.readString(payload.evaluation_id) ?? artifact.artifact_id;
      if (!byId.has(receiptId)) {
        byId.set(receiptId, {
          ...payload,
          receipt_id: receiptId,
          artifact_ref: artifact.artifact_id,
          artifact_kind: artifact.kind,
        });
      }
    }
    return Array.from(byId.values());
  };

  const collectHelixRuntimeComposerCoverageArtifacts = (
    artifacts: HelixRuntimeComposerCollectorArtifact[],
  ): Array<Record<string, unknown>> =>
    artifacts.flatMap((artifact): Array<Record<string, unknown>> => {
      if (!/coverage|satisfaction|evaluation/i.test(artifact.kind)) return [];
      const payload = deps.readArtifactPayloadRecord(artifact);
      if (!payload) return [];
      return [{
        ...payload,
        ref: artifact.artifact_id,
        artifact_kind: artifact.kind,
      }];
    });

  const collectHelixRuntimeComposerToolObservations = (
    artifacts: HelixRuntimeComposerCollectorArtifact[],
  ): Array<Record<string, unknown>> =>
    artifacts.flatMap((artifact): Array<Record<string, unknown>> => {
      if (!/tool_observation|runtime_tool_call|workspace_os_status_observation|workspace_action_receipt|calculator_result_trace|doc_search_results|doc_open_receipt/i.test(artifact.kind)) {
        return [];
      }
      const payload = deps.readArtifactPayloadRecord(artifact);
      if (!payload) return [];
      return [{
        ...payload,
        ref: artifact.artifact_id,
        artifact_kind: artifact.kind,
      }];
    });

  const collectHelixRuntimeComposerTextLines = (value: unknown, lines: string[]): void => {
    if (typeof value === "string") {
      const text = value.trim();
      if (text) lines.push(text);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) collectHelixRuntimeComposerTextLines(item, lines);
    }
  };

  return {
    collectHelixRuntimeComposerReceipts,
    collectHelixRuntimeComposerCoverageArtifacts,
    collectHelixRuntimeComposerToolObservations,
    collectHelixRuntimeComposerTextLines,
  };
};
