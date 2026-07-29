import {
  HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA,
  type HelixConversationMemoryPacket,
} from "../../../shared/helix-conversation-memory-packet";

const normalizeText = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const DOCUMENT_PATH_RE =
  /\.(?:md|mdx|txt|tex|pdf|json|ya?ml|csv|tsv)$/i;

export const resolvePriorWorkspaceDocumentPath = (
  ref: unknown,
): string | null => {
  const normalized = normalizeText(ref).replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.startsWith("artifact://") ||
    normalized.startsWith("thread_item:")
  ) {
    return null;
  }
  const path = normalized.replace(/:\d+(?:-\d+)?$/, "");
  if (
    !DOCUMENT_PATH_RE.test(path) ||
    path.split("/").some((segment) => segment === "..")
  ) {
    return null;
  }
  return path;
};

export const buildPriorDocumentContinuationHint = (input: {
  turnId: string;
  prompt: string;
  packet: unknown;
}): Record<string, unknown> | null => {
  const packet =
    input.packet &&
    typeof input.packet === "object" &&
    !Array.isArray(input.packet)
      ? (input.packet as Partial<HelixConversationMemoryPacket>)
      : null;
  if (
    packet?.schema !== HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA ||
    packet.allowed_for_current_goal !== true ||
    packet.allowed_use !== "reuse_prior_evidence_refs" ||
    !Array.isArray(packet.reusable_evidence_refs)
  ) {
    return null;
  }
  const documentPath = [...packet.reusable_evidence_refs]
    .reverse()
    .map(resolvePriorWorkspaceDocumentPath)
    .find((entry): entry is string => Boolean(entry));
  if (!documentPath) return null;
  return {
    schema: "helix.runtime_continuation_hint.v1",
    hint_id: `${input.turnId}:provider_same_document_continuation`,
    capability_id: "docs.search",
    lane_request: {
      capability: "docs.search",
      query: normalizeText(input.prompt),
      paths: [documentPath],
      max_hits: 12,
    },
    reason:
      "The current prompt explicitly continues the prior cited document. Search is bounded to that exact current-thread evidence identity; a different source is not admitted.",
    source_ref: `${input.turnId}:conversation_memory_packet`,
    source_document_path: documentPath,
    admissible: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
