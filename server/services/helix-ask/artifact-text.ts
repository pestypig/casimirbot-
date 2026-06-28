import { normalizeAskTurnWorkspaceDocPath } from "./doc-args";
import { readAskTurnString } from "./value-readers";

export const normalizeAskTurnArtifactText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    return text ? value.trim() : null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["answer_text", "text", "summary", "result_summary", "result_text", "answer", "final_text", "visible_text", "message", "content"]) {
    const nested = normalizeAskTurnArtifactText(record[key]);
    if (nested) return nested;
  }
  return null;
};

export const readAskTurnArtifactTextByKind = (
  artifactStore: Record<string, unknown> | undefined,
  kinds: string[],
): string | null => {
  if (!artifactStore) return null;
  for (const kind of kinds) {
    const text = normalizeAskTurnArtifactText(artifactStore[kind]);
    if (text) return text;
  }
  return null;
};

export const isAskTurnInstructionOnlySummaryText = (value: unknown): boolean => {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!text) return false;
  return (
    /^summari[sz]e\b[\s\S]*\b(?:doc|document|paper)\b/i.test(text) ||
    /^(?:write|put|add|append)\b[\s\S]*\b(?:summary|key points?)\b/i.test(text) ||
    /^summari[sz]e the key points from the document\.?$/i.test(text)
  );
};

type HelixAskLedgerArtifactLike = {
  artifact_id?: string | null;
  turn_id?: string | null;
  producer_item_id?: string | null;
  kind: string;
  payload?: unknown;
};

export const mergeAskTurnLedgerArtifacts = <Artifact extends HelixAskLedgerArtifactLike>(
  artifacts: Artifact[],
): Artifact[] => {
  const seen = new Set<string>();
  const merged: Artifact[] = [];
  for (const artifact of artifacts) {
    const key = artifact.artifact_id || `${artifact.turn_id}:${artifact.producer_item_id}:${artifact.kind}:${merged.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(artifact);
  }
  return merged;
};

export const readAskTurnLedgerArtifact = <Artifact extends { kind: string }>(
  artifacts: Artifact[],
  kinds: string[],
): Artifact | null => artifacts.find((artifact) => kinds.includes(artifact.kind)) ?? null;

export const readAskTurnArtifactPayloadRecord = (
  artifact: { payload?: unknown },
): Record<string, unknown> | null =>
  artifact.payload && typeof artifact.payload === "object" ? (artifact.payload as Record<string, unknown>) : null;

export const readAskTurnArtifactSourcePath = (payload: Record<string, unknown> | null): string | null =>
  normalizeAskTurnWorkspaceDocPath(payload?.source_path) ??
  normalizeAskTurnWorkspaceDocPath(payload?.path) ??
  normalizeAskTurnWorkspaceDocPath(payload?.active_doc_path);

export const readAskTurnArtifactSnippets = (payload: Record<string, unknown> | null): Record<string, unknown>[] =>
  Array.isArray(payload?.snippets)
    ? payload.snippets.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
    : Array.isArray(payload?.matches)
      ? payload.matches.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
      : [];

export const askTurnArtifactHasNonemptyText = (artifact: { payload?: unknown }): boolean => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  return Boolean(
    readAskTurnString(payload?.answer_text)?.trim() ||
      readAskTurnString(payload?.plain_language_summary)?.trim() ||
      readAskTurnString(payload?.text)?.trim(),
  );
};

export const askTurnArtifactHasEvidenceSnippets = (artifact: { payload?: unknown }): boolean => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  return Array.isArray(payload?.snippets) && payload.snippets.length > 0;
};

export const askTurnArtifactHasNumericValues = (artifact: { payload?: unknown }): boolean => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  return Array.isArray(payload?.values) && payload.values.length > 0;
};

export const askTurnArtifactHasSourcePath = (artifact: { payload?: unknown }): boolean => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  return Boolean(readAskTurnString(payload?.source_path)?.trim() || readAskTurnString(payload?.path)?.trim());
};
