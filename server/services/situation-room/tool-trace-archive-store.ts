import crypto from "node:crypto";
import {
  HELIX_TOOL_TRACE_ARCHIVE_SCHEMA,
  type HelixToolTraceArchive,
} from "@shared/helix-tool-trace-archive";
import { listWorkstationReasoningTraces } from "../helix-ask/workstation-reasoning-trace-store";

const archivesByProfile = new Map<string, HelixToolTraceArchive[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function archiveToolTraces(input: {
  profileId: string;
  threadId: string;
  limit?: number;
}): HelixToolTraceArchive {
  const traces = listWorkstationReasoningTraces({
    threadId: input.threadId,
    limit: input.limit ?? 50,
  });
  const createdAt = new Date().toISOString();
  const archive: HelixToolTraceArchive = {
    schema: HELIX_TOOL_TRACE_ARCHIVE_SCHEMA,
    archive_id: `tool_trace_archive:${hashShort([input.profileId, input.threadId, createdAt], 20)}`,
    profile_id: input.profileId,
    thread_id: input.threadId,
    trace_ids: traces.map((trace) => trace.trace_id),
    summaries: traces.map((trace) => ({
      trace_id: trace.trace_id,
      user_goal: trace.user_goal,
      final_answer_snapshot: trace.final_answer_snapshot,
      key_evidence_refs: trace.evidence_refs.slice(0, 12),
      tool_receipt_ids: trace.tool_receipt_ids,
      proof_status: trace.proof_status,
      scope_match: trace.scope_match,
    })),
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  const existing = archivesByProfile.get(input.profileId) ?? [];
  archivesByProfile.set(input.profileId, [...existing, archive].slice(-100));
  return archive;
}

export function listToolTraceArchives(profileId: string): HelixToolTraceArchive[] {
  return [...(archivesByProfile.get(profileId) ?? [])];
}

export function clearToolTraceArchivesForTest(): void {
  archivesByProfile.clear();
}
