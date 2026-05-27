import crypto from "node:crypto";
import {
  HELIX_SITUATION_CONSTRUCT_SCHEMA,
  type HelixSituationConstruct,
  type HelixSituationConstructOutputBinding,
  type HelixSituationConstructStatus,
  type HelixSituationConstructType,
} from "@shared/helix-situation-construct";

const constructsById = new Map<string, HelixSituationConstruct>();
const constructIdsByThread = new Map<string, string[]>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(normalizeString).filter((entry): entry is string => Boolean(entry))))
    : [];

const normalizeStatus = (value: unknown): HelixSituationConstructStatus => {
  const status = normalizeString(value);
  if (
    status === "planned" ||
    status === "receipt_only" ||
    status === "active" ||
    status === "blocked" ||
    status === "stale" ||
    status === "detached" ||
    status === "completed"
  ) {
    return status;
  }
  return "planned";
};

const normalizeType = (value: unknown): HelixSituationConstructType => {
  const type = normalizeString(value);
  if (
    type === "live_environment" ||
    type === "source_binding" ||
    type === "transcription_job" ||
    type === "observer" ||
    type === "voice_policy" ||
    type === "commentary_policy" ||
    type === "field_worker_policy" ||
    type === "field_worker" ||
    type === "dottie_manifest" ||
    type === "route_evidence_view" ||
    type === "live_answer_output" ||
    type === "commentary_output" ||
    type === "note_output"
  ) {
    return type;
  }
  throw new Error("Situation construct requires a valid type.");
};

const normalizeOutputBindings = (values: unknown): HelixSituationConstructOutputBinding[] => {
  if (!Array.isArray(values)) return [];
  return values.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const outputKind = normalizeString(record.output_kind);
    if (
      outputKind !== "live_answer_environment" &&
      outputKind !== "transcript_stream" &&
      outputKind !== "typed_commentary" &&
      outputKind !== "voice_proposal" &&
      outputKind !== "route_evidence_view" &&
      outputKind !== "note"
    ) {
      return [];
    }
    const status = normalizeString(record.status);
    return [{
      output_kind: outputKind,
      artifact_ref: normalizeString(record.artifact_ref),
      status: status === "active" || status === "blocked" || status === "detached" ? status : "planned",
    }];
  });
};

const allowedConstructTool = (value: string): boolean =>
  /^live_env\.query_[a-z0-9_]+$/i.test(value) || /^minecraft\.query_[a-z0-9_]+$/i.test(value);

const normalizeAllowedTools = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(normalizeString).filter((entry): entry is string => Boolean(entry))))
      .filter(allowedConstructTool)
    : [];

const constructMaySpeak = (
  type: HelixSituationConstructType,
  input: Partial<HelixSituationConstruct["policy"]> | null | undefined,
): boolean => {
  if (type === "voice_policy") {
    return false;
  }
  if (type === "observer" || type === "dottie_manifest" || type === "transcription_job" || type === "source_binding") {
    return false;
  }
  return input?.may_speak === true;
};

const normalizeConstructPolicy = (
  type: HelixSituationConstructType,
  input: Partial<HelixSituationConstruct["policy"]> | null | undefined,
): HelixSituationConstruct["policy"] => {
  const allowed_tools = normalizeAllowedTools(input?.allowed_tools);
  const executableType = type === "route_evidence_view" || type === "field_worker_policy" || type === "field_worker";
  const may_execute_tools = input?.may_execute_tools === true && executableType && allowed_tools.length > 0;
  const witness_only = type === "observer" || input?.witness_only === true;
  return {
    may_execute_tools,
    allowed_tools: may_execute_tools ? allowed_tools : [],
    may_spawn_workers: input?.may_spawn_workers === true && type !== "observer" && type !== "dottie_manifest",
    may_speak: constructMaySpeak(type, input),
    may_surface_user_text: input?.may_surface_user_text === true && !witness_only && type !== "transcription_job",
    requires_user_confirmation: input?.requires_user_confirmation !== false,
    witness_only,
  };
};

export function makeSituationConstructId(input: {
  threadId: string;
  roomId: string;
  type: HelixSituationConstructType;
  name: string;
  seed?: string | null;
}): string {
  return `situation_construct:${input.type}:${hashShort([
    input.threadId,
    input.roomId,
    input.type,
    input.name,
    input.seed ?? null,
  ])}`;
}

export function createSituationConstruct(input: {
  construct_id?: string | null;
  type: HelixSituationConstructType | string;
  name: string;
  description?: string | null;
  status?: HelixSituationConstructStatus | string | null;
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  source_ids?: string[] | null;
  parent_construct_ids?: string[] | null;
  child_construct_ids?: string[] | null;
  artifact_refs?: string[] | null;
  receipt_refs?: string[] | null;
  commentary_refs?: string[] | null;
  evidence_refs?: string[] | null;
  output_bindings?: HelixSituationConstructOutputBinding[] | null;
  policy?: Partial<HelixSituationConstruct["policy"]> | null;
  safety?: Partial<HelixSituationConstruct["safety"]> | null;
  created_at?: string | null;
  updated_at?: string | null;
}): HelixSituationConstruct {
  const threadId = normalizeString(input.thread_id);
  const roomId = normalizeString(input.room_id);
  const name = normalizeString(input.name);
  if (!threadId) throw new Error("Situation construct requires thread_id.");
  if (!roomId) throw new Error("Situation construct requires room_id.");
  if (!name) throw new Error("Situation construct requires name.");
  const type = normalizeType(input.type);
  const constructId = normalizeString(input.construct_id) ?? makeSituationConstructId({
    threadId,
    roomId,
    type,
    name,
    seed: input.description,
  });
  if (constructsById.has(constructId)) {
    throw new Error(`Situation construct already exists: ${constructId}`);
  }
  const createdAt = normalizeString(input.created_at) ?? new Date().toISOString();
  const construct: HelixSituationConstruct = {
    schema: HELIX_SITUATION_CONSTRUCT_SCHEMA,
    construct_id: constructId,
    type,
    name,
    description: normalizeString(input.description),
    status: normalizeStatus(input.status),
    thread_id: threadId,
    room_id: roomId,
    environment_id: normalizeString(input.environment_id),
    source_ids: uniqueStrings(input.source_ids ?? []),
    parent_construct_ids: uniqueStrings(input.parent_construct_ids ?? []),
    child_construct_ids: uniqueStrings(input.child_construct_ids ?? []),
    artifact_refs: uniqueStrings(input.artifact_refs ?? []),
    receipt_refs: uniqueStrings(input.receipt_refs ?? []),
    commentary_refs: uniqueStrings(input.commentary_refs ?? []),
    evidence_refs: uniqueStrings(input.evidence_refs ?? []),
    output_bindings: normalizeOutputBindings(input.output_bindings ?? []),
    policy: normalizeConstructPolicy(type, input.policy),
    safety: {
      assistant_answer: false,
      raw_content_included: false,
      raw_audio_included: false,
      raw_user_text_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      ask_context_policy: input.safety?.ask_context_policy ?? "evidence_only",
      context_role: input.safety?.context_role ?? "tool_evidence",
    },
    created_at: createdAt,
    updated_at: normalizeString(input.updated_at) ?? createdAt,
  };
  if (construct.safety.ask_context_policy !== "evidence_only" && construct.safety.context_role !== "operator_referral") {
    throw new Error("Non-evidence construct context must be operator referral.");
  }
  constructsById.set(construct.construct_id, construct);
  const current = constructIdsByThread.get(construct.thread_id) ?? [];
  constructIdsByThread.set(construct.thread_id, Array.from(new Set([...current, construct.construct_id])).slice(-500));
  return construct;
}

export function upsertSituationConstruct(
  input: Parameters<typeof createSituationConstruct>[0],
): HelixSituationConstruct {
  const existingId = normalizeString(input.construct_id);
  const existing = existingId ? constructsById.get(existingId) : null;
  if (!existing) return createSituationConstruct(input);
  const updated: HelixSituationConstruct = {
    ...existing,
    name: normalizeString(input.name) ?? existing.name,
    description: normalizeString(input.description) ?? existing.description,
    status: input.status ? normalizeStatus(input.status) : existing.status,
    environment_id: normalizeString(input.environment_id) ?? existing.environment_id,
    source_ids: uniqueStrings([...(existing.source_ids ?? []), ...(input.source_ids ?? [])]),
    parent_construct_ids: uniqueStrings([...(existing.parent_construct_ids ?? []), ...(input.parent_construct_ids ?? [])]),
    child_construct_ids: uniqueStrings([...(existing.child_construct_ids ?? []), ...(input.child_construct_ids ?? [])]),
    artifact_refs: uniqueStrings([...(existing.artifact_refs ?? []), ...(input.artifact_refs ?? [])]),
    receipt_refs: uniqueStrings([...(existing.receipt_refs ?? []), ...(input.receipt_refs ?? [])]),
    commentary_refs: uniqueStrings([...(existing.commentary_refs ?? []), ...(input.commentary_refs ?? [])]),
    evidence_refs: uniqueStrings([...(existing.evidence_refs ?? []), ...(input.evidence_refs ?? [])]),
    output_bindings: normalizeOutputBindings([
      ...existing.output_bindings,
      ...(input.output_bindings ?? []),
    ]),
    policy: input.policy ? normalizeConstructPolicy(existing.type, input.policy) : existing.policy,
    updated_at: normalizeString(input.updated_at) ?? new Date().toISOString(),
  };
  constructsById.set(updated.construct_id, updated);
  return updated;
}

export function getSituationConstruct(constructId: string): HelixSituationConstruct | null {
  return constructsById.get(constructId) ?? null;
}

export function listSituationConstructs(input: {
  threadId: string;
  roomId?: string | null;
  type?: HelixSituationConstructType | string | null;
  status?: HelixSituationConstructStatus | string | null;
  limit?: number;
}): HelixSituationConstruct[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(500, Math.trunc(input.limit ?? 100))) : 100;
  const type = normalizeString(input.type);
  const status = normalizeString(input.status);
  return (constructIdsByThread.get(input.threadId) ?? [])
    .map((constructId) => constructsById.get(constructId))
    .filter((construct): construct is HelixSituationConstruct => Boolean(construct))
    .filter((construct) => !input.roomId || construct.room_id === input.roomId)
    .filter((construct) => !type || construct.type === type)
    .filter((construct) => !status || construct.status === status)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function linkSituationConstructs(input: {
  parentConstructId: string;
  childConstructId: string;
}): void {
  const parent = constructsById.get(input.parentConstructId);
  const child = constructsById.get(input.childConstructId);
  if (!parent || !child) return;
  constructsById.set(parent.construct_id, {
    ...parent,
    child_construct_ids: uniqueStrings([...parent.child_construct_ids, child.construct_id]),
    updated_at: new Date().toISOString(),
  });
  constructsById.set(child.construct_id, {
    ...child,
    parent_construct_ids: uniqueStrings([...child.parent_construct_ids, parent.construct_id]),
    updated_at: new Date().toISOString(),
  });
}

export function recordConstructCommentaryRef(input: {
  constructId: string;
  commentaryRef: string;
}): HelixSituationConstruct {
  const construct = constructsById.get(input.constructId);
  if (!construct) throw new Error(`Unknown situation construct: ${input.constructId}`);
  const updated = {
    ...construct,
    commentary_refs: uniqueStrings([...construct.commentary_refs, input.commentaryRef]),
    evidence_refs: uniqueStrings([...construct.evidence_refs, input.commentaryRef]),
    updated_at: new Date().toISOString(),
  };
  constructsById.set(updated.construct_id, updated);
  return updated;
}

export function recordConstructReceiptRef(input: {
  constructId: string;
  receiptRef: string;
}): HelixSituationConstruct {
  const construct = constructsById.get(input.constructId);
  if (!construct) throw new Error(`Unknown situation construct: ${input.constructId}`);
  const updated = {
    ...construct,
    receipt_refs: uniqueStrings([...construct.receipt_refs, input.receiptRef]),
    evidence_refs: uniqueStrings([...construct.evidence_refs, input.receiptRef]),
    updated_at: new Date().toISOString(),
  };
  constructsById.set(updated.construct_id, updated);
  return updated;
}

export function resetSituationConstructStoreForTest(): void {
  constructsById.clear();
  constructIdsByThread.clear();
}
