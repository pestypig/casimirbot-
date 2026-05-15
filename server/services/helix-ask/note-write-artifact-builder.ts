import crypto from "node:crypto";
import {
  HELIX_NOTE_WRITE_ARTIFACT_SCHEMA,
  type HelixNoteWriteArtifact,
} from "@shared/helix-note-write-artifact";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const compact = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export function inferNoteTitleFromGoal(input: {
  userGoal: string;
  sourceTitle?: string | null;
  sourcePath?: string | null;
}): string {
  const explicit =
    input.userGoal.match(/\b(?:titled|called|named)\s+["']([^"']+)["']/i)?.[1] ??
    input.userGoal.match(/\b(?:titled|called|named)\s+(.+?)(?:\s+with\b|\s+about\b|$)/i)?.[1];
  if (explicit && compact(explicit)) return compact(explicit).slice(0, 80);
  if (input.sourceTitle && compact(input.sourceTitle)) return `${compact(input.sourceTitle).slice(0, 64)} notes`;
  const fileName = input.sourcePath?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "");
  if (fileName && compact(fileName)) return `${compact(fileName).slice(0, 64)} notes`;
  if (/\b(?:(?:this|the)\s+)?(?:open|current|active)\s+doc(?:ument)?\b/i.test(input.userGoal)) {
    return "Open document summary";
  }
  if (/\bdoc(?:ument)?\b/i.test(input.userGoal)) return "Document summary";
  return "Helix workstation note";
}

export function buildNoteWriteArtifact(input: {
  threadId: string;
  turnId: string;
  userGoal: string;
  operation?: HelixNoteWriteArtifact["operation"];
  noteId?: string | null;
  noteTitle?: string | null;
  noteBody?: string | null;
  receiptId?: string | null;
  sourceArtifactRefs?: string[];
  sourceTitle?: string | null;
  sourcePath?: string | null;
  createdAt?: string;
}): HelixNoteWriteArtifact {
  const title =
    compact(input.noteTitle) ||
    inferNoteTitleFromGoal({
      userGoal: input.userGoal,
      sourceTitle: input.sourceTitle,
      sourcePath: input.sourcePath,
    });
  const bodySummary =
    compact(input.noteBody) ||
    (input.sourceTitle
      ? `Compact note requested for ${input.sourceTitle}.`
      : "Compact workstation note requested by Helix Ask.");
  return {
    schema: HELIX_NOTE_WRITE_ARTIFACT_SCHEMA,
    artifact_id: `note-write:${hashShort([input.threadId, input.turnId, title, bodySummary])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    note_id: input.noteId ?? null,
    note_title: title,
    note_body_summary: bodySummary.slice(0, 800),
    receipt_id: input.receiptId ?? null,
    source_artifact_refs: input.sourceArtifactRefs ?? [],
    operation: input.operation ?? "create_note",
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}
