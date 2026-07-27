import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type {
  HelixAgentRunEvent,
  HelixAgentRunEventType,
} from "@shared/contracts/helix-agent-api.v1";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";
import type { HelixAgentRunOwner } from "../helix-agent-api/run-store";
import { redactSharedLiveRoomSensitiveText } from "./sensitive-text";

type RecordLike = Record<string, unknown>;

export type SharedLiveRoomBindingStoreErrorCode =
  | "binding_invalid"
  | "run_not_found"
  | "room_not_found"
  | "room_membership_required"
  | "room_closed"
  | "run_room_binding_conflict"
  | "run_room_binding_not_found"
  | "chat_binding_not_found"
  | "chat_binding_expired"
  | "chat_binding_not_claimable"
  | "chat_binding_owner_mismatch"
  | "chat_binding_conflict"
  | "chat_session_owner_mismatch"
  | "credential_delivery_not_found"
  | "credential_delivery_expired"
  | "credential_delivery_not_claimable"
  | "source_binding_not_found"
  | "source_binding_owner_mismatch"
  | "source_binding_closed"
  | "terminal_projection_sensitive_content_rejected";

export class SharedLiveRoomBindingStoreError extends Error {
  constructor(
    readonly code: SharedLiveRoomBindingStoreErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "SharedLiveRoomBindingStoreError";
  }
}

export type SharedLiveRoomRunRoomBinding = {
  bindingId: string;
  runId: string;
  owner: HelixAgentRunOwner;
  roomId: string;
  authorizedByProfileId: string;
  participantIdAtBind: string;
  memberRoleAtBind: "owner" | "participant";
  consentVersionAtBind: number;
  consentReceiptRefAtBind: string | null;
  status: "active" | "revoked";
  version: number;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
};

export type SharedLiveRoomChatContextMessage = {
  role: "user" | "assistant";
  content: string;
  at: string | null;
};

export type SharedLiveRoomChatContextSnapshot = {
  schema: "helix.agent_run_chat_context_snapshot.v1";
  messages: SharedLiveRoomChatContextMessage[];
  captured_at: string;
  context_role: "non_authoritative_conversation_context";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type SharedLiveRoomRunChatBinding = {
  bindingId: string;
  browserProfileId: string;
  chatSessionId: string;
  claimExpiresAt: string;
  runId: string | null;
  owner: HelixAgentRunOwner | null;
  status: "pending_claim" | "active" | "revoked" | "expired";
  contextSnapshot: SharedLiveRoomChatContextSnapshot | null;
  contextSnapshotRef: string | null;
  contextMessageCount: number;
  contextCharCount: number;
  createdAt: string;
  updatedAt: string;
  claimedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
};

export type SharedLiveRoomBindingRevocationResult<
  TBinding extends SharedLiveRoomRunRoomBinding | SharedLiveRoomRunChatBinding,
> = {
  binding: TBinding;
  revocationStatus: "revoked" | "already_revoked";
};

export type SharedLiveRoomObserverEventPage = {
  binding: SharedLiveRoomRunChatBinding;
  events: HelixAgentRunEvent[];
  nextAfterSeq: number;
  hasMore: boolean;
};

export type SharedLiveRoomAuthorizedTerminalMessage = {
  projectionId: string;
  bindingRef: string;
  runId: string;
  authorityRef: string;
  artifactKind: string;
  terminalTextHash: string;
  supportingEvidenceRefs: string[];
  messageId: string;
  role: "assistant";
  content: string;
  at: string;
};

export type SharedLiveRoomCredentialDelivery = {
  deliveryId: string;
  bindingId: string;
  ownerProfileId: string;
  purpose: "create" | "rotate";
  credentialTtlMs: number;
  status: "pending" | "claimed" | "expired" | "revoked" | "outcome_unknown";
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  claimedAt: string | null;
  revokedAt: string | null;
};

export type SharedLiveRoomCredentialClaimPrerequisites = {
  deliveryId: string;
  bindingId: string;
  roomId: string;
  sourceId: string;
  ownerProfileId: string;
  purpose: "create" | "rotate";
  credentialTtlMs: number;
  claimedAt: string;
};

type RunRoomBindingRow = {
  binding_id: string;
  run_id: string;
  tenant_id: string;
  issuer: string;
  subject_id: string;
  account_profile_id: string;
  room_id: string;
  authorized_by_profile_id: string;
  participant_id_at_bind: string;
  member_role_at_bind: string;
  consent_version_at_bind: number | string | null;
  consent_receipt_ref_at_bind: string | null;
  status: string;
  version: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  revoked_at: Date | string | null;
  revoke_reason: string | null;
};

type RunChatBindingRow = {
  binding_id: string;
  browser_profile_id: string;
  chat_session_id: string;
  claim_handle_hash: string;
  claim_expires_at: Date | string;
  run_id: string | null;
  tenant_id: string | null;
  issuer: string | null;
  subject_id: string | null;
  account_profile_id: string | null;
  status: string;
  context_snapshot: SharedLiveRoomChatContextSnapshot | string | null;
  context_snapshot_ref: string | null;
  context_message_count: number | string;
  context_char_count: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  claimed_at: Date | string | null;
  revoked_at: Date | string | null;
  revoke_reason: string | null;
};

type AgentRunProjectionRow = {
  run_id: string;
  version: number | string;
  lifecycle_status: string;
  completion_status: string;
  terminal_authority_status: string;
  evidence_bundle: RecordLike | string;
  latest_result: RecordLike | string | null;
};

type TerminalProjectionRow = {
  projection_id: string;
  binding_id: string;
  run_id: string;
  authority_ref: string;
  terminal_text: string;
  terminal_text_hash: string;
  artifact_kind: string;
  supporting_evidence_refs: string[] | string;
  message_id: string;
  projected_at: Date | string;
};

type AgentEventRow = {
  seq: number | string;
  event_id: string;
  run_id: string;
  event_type: HelixAgentRunEventType;
  payload: RecordLike | string;
  created_at: Date | string;
};

type CredentialDeliveryRow = {
  delivery_id: string;
  binding_id: string;
  owner_profile_id: string;
  purpose: string;
  credential_ttl_ms: number | string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string;
  claimed_at: Date | string | null;
  revoked_at: Date | string | null;
};

const iso = (value: Date | string | null): string | null => {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

const parseJson = <T>(value: T | string | null, fallback: T): T => {
  if (value === null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const record = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const exactText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const stringArray = (value: unknown, maxItems = 128): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .slice(0, maxItems)
            .map((entry) => text(entry))
            .filter(Boolean),
        ),
      )
    : [];

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const hashRef = (kind: string, value: string): string =>
  `${kind}:sha256:${sha256(value)}`;

const ownerParams = (owner: HelixAgentRunOwner): string[] => [
  owner.tenantId,
  owner.issuer,
  owner.subjectId,
  owner.accountProfileId,
];

const roomBindingFromRow = (
  row: RunRoomBindingRow,
): SharedLiveRoomRunRoomBinding => ({
  bindingId: row.binding_id,
  runId: row.run_id,
  owner: {
    tenantId: row.tenant_id,
    issuer: row.issuer,
    subjectId: row.subject_id,
    accountProfileId: row.account_profile_id,
  },
  roomId: row.room_id,
  authorizedByProfileId: row.authorized_by_profile_id,
  participantIdAtBind: row.participant_id_at_bind,
  memberRoleAtBind:
    row.member_role_at_bind === "participant" ? "participant" : "owner",
  consentVersionAtBind:
    row.consent_version_at_bind === null
      ? -1
      : Number(row.consent_version_at_bind),
  consentReceiptRefAtBind: row.consent_receipt_ref_at_bind,
  status: row.status === "revoked" ? "revoked" : "active",
  version: Number(row.version),
  createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  updatedAt: iso(row.updated_at) ?? new Date(0).toISOString(),
  revokedAt: iso(row.revoked_at),
  revokeReason: row.revoke_reason,
});

const effectiveChatBindingStatus = (
  row: RunChatBindingRow,
  nowMs = Date.now(),
): SharedLiveRoomRunChatBinding["status"] => {
  if (
    row.status === "pending_claim" &&
    new Date(row.claim_expires_at).getTime() <= nowMs
  ) {
    return "expired";
  }
  if (
    row.status === "active" ||
    row.status === "revoked" ||
    row.status === "expired"
  ) {
    return row.status;
  }
  return "pending_claim";
};

const chatBindingFromRow = (
  row: RunChatBindingRow,
  nowMs = Date.now(),
): SharedLiveRoomRunChatBinding => ({
  bindingId: row.binding_id,
  browserProfileId: row.browser_profile_id,
  chatSessionId: row.chat_session_id,
  claimExpiresAt: iso(row.claim_expires_at) ?? new Date(0).toISOString(),
  runId: row.run_id,
  owner:
    row.run_id &&
    row.tenant_id &&
    row.issuer &&
    row.subject_id &&
    row.account_profile_id
      ? {
          tenantId: row.tenant_id,
          issuer: row.issuer,
          subjectId: row.subject_id,
          accountProfileId: row.account_profile_id,
        }
      : null,
  status: effectiveChatBindingStatus(row, nowMs),
  contextSnapshot: parseJson(row.context_snapshot, null),
  contextSnapshotRef: row.context_snapshot_ref,
  contextMessageCount: Number(row.context_message_count),
  contextCharCount: Number(row.context_char_count),
  createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  updatedAt: iso(row.updated_at) ?? new Date(0).toISOString(),
  claimedAt: iso(row.claimed_at),
  revokedAt: iso(row.revoked_at),
  revokeReason: row.revoke_reason,
});

const finiteInteger = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

const boundedToken = (value: unknown, maxLength = 240): string | null => {
  const normalized = text(value);
  const sanitized = redactSharedLiveRoomSensitiveText(normalized).text;
  return sanitized &&
    sanitized.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/.test(sanitized)
    ? sanitized
    : null;
};

const OBSERVER_STATUS_ROW_LIMIT = 24;
const OBSERVER_BINDING_REVOKE_REASON =
  "browser_owner_disconnected_observer_binding";
const observerStatusRows = (input: {
  observationRefs: string[];
  evidenceRefs: string[];
  receiptRefs: string[];
}): RecordLike[] => {
  const rows: RecordLike[] = [];
  const append = (
    kind: "observation" | "evidence" | "receipt",
    refs: readonly string[],
  ): void => {
    for (const ref of refs) {
      if (rows.length >= OBSERVER_STATUS_ROW_LIMIT) return;
      const redacted = redactSharedLiveRoomSensitiveText(ref);
      const safeRef = redacted.redacted ? null : boundedToken(redacted.text);
      if (!safeRef) continue;
      rows.push({
        kind,
        status: "reentered",
        status_ref: hashRef(`observer-${kind}`, safeRef),
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
    }
  };
  append("observation", input.observationRefs);
  append("evidence", input.evidenceRefs);
  append("receipt", input.receiptRefs);
  return rows;
};

/**
 * Agent events are already non-authoritative, but their durable payload column
 * is intentionally extensible. The browser observer therefore projects a
 * small lifecycle allowlist instead of forwarding arbitrary future payloads.
 * This prevents instructions, provider payloads, chat text, credentials, or
 * chain-of-thought-like material from entering the browser lane by accident.
 */
const sanitizeObserverEventPayload = (
  eventType: HelixAgentRunEventType,
  raw: RecordLike,
): RecordLike => {
  const payload: RecordLike = {};
  const version = finiteInteger(raw.version);
  if (version !== null) payload.version = version;

  const copyToken = (key: string, maxLength = 240): void => {
    const value = boundedToken(raw[key], maxLength);
    if (value) payload[key] = value;
  };
  const copyInteger = (key: string): void => {
    const value = finiteInteger(raw[key]);
    if (value !== null) payload[key] = value;
  };

  switch (eventType) {
    case "run_started":
      copyToken("lifecycle_status", 40);
      copyToken("completion_status", 40);
      copyToken("terminal_authority_status", 60);
      break;
    case "runtime_recovered":
      copyToken("lifecycle_status", 40);
      copyToken("completion_status", 40);
      break;
    case "continuation_received":
      copyInteger("steps_used");
      break;
    case "evidence_reentered": {
      const observationRefs = stringArray(raw.observation_refs, 128);
      const evidenceRefs = stringArray(raw.evidence_refs, 128);
      const receiptRefs = stringArray(raw.receipt_refs, 128);
      payload.observation_ref_count = observationRefs.length;
      payload.evidence_ref_count = evidenceRefs.length;
      payload.receipt_ref_count = receiptRefs.length;
      payload.status_rows = observerStatusRows({
        observationRefs,
        evidenceRefs,
        receiptRefs,
      });
      break;
    }
    case "issues_resolved":
      payload.resolved_requirement_count = stringArray(
        raw.resolved_requirements,
        128,
      ).length;
      payload.resolved_contradiction_count = stringArray(
        raw.resolved_contradictions,
        128,
      ).length;
      break;
    case "input_requested":
      payload.question_count = Array.isArray(raw.questions)
        ? Math.min(raw.questions.length, 64)
        : 0;
      payload.pending_input = Number(payload.question_count) > 0;
      break;
    case "terminal_authority_evaluated":
      copyToken("terminal_authority_status", 60);
      if (typeof raw.terminal_product_projected === "boolean") {
        payload.terminal_product_projected = raw.terminal_product_projected;
      }
      break;
    case "run_waiting":
    case "run_completed":
    case "run_blocked":
    case "run_failed":
    case "run_cancelled":
    case "budget_exhausted":
      copyToken("lifecycle_status", 40);
      copyToken("completion_status", 40);
      copyToken("failure_code", 120);
      copyInteger("steps_used");
      copyInteger("max_steps");
      break;
  }
  return payload;
};

const eventFromRow = (row: AgentEventRow): HelixAgentRunEvent => {
  const rawPayload = parseJson(row.payload, {});
  return {
    schema: "helix.agent_run.event.v1",
    event_id: row.event_id,
    run_id: row.run_id,
    seq: Number(row.seq),
    event_type: row.event_type,
    payload: sanitizeObserverEventPayload(row.event_type, rawPayload),
    created_at: iso(row.created_at) ?? new Date(0).toISOString(),
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const terminalProjectionFromRow = (
  row: TerminalProjectionRow,
): SharedLiveRoomAuthorizedTerminalMessage => ({
  projectionId: row.projection_id,
  bindingRef: row.binding_id,
  runId: row.run_id,
  authorityRef: row.authority_ref,
  artifactKind: row.artifact_kind,
  terminalTextHash: row.terminal_text_hash,
  supportingEvidenceRefs: parseJson(row.supporting_evidence_refs, []),
  messageId: row.message_id,
  role: "assistant",
  content: row.terminal_text,
  at: iso(row.projected_at) ?? new Date(0).toISOString(),
});

const credentialDeliveryFromRow = (
  row: CredentialDeliveryRow,
): SharedLiveRoomCredentialDelivery => ({
  deliveryId: row.delivery_id,
  bindingId: row.binding_id,
  ownerProfileId: row.owner_profile_id,
  purpose: row.purpose === "rotate" ? "rotate" : "create",
  credentialTtlMs: Number(row.credential_ttl_ms),
  status:
    row.status === "claimed" ||
    row.status === "expired" ||
    row.status === "revoked" ||
    row.status === "outcome_unknown"
      ? row.status
      : "pending",
  createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  updatedAt: iso(row.updated_at) ?? new Date(0).toISOString(),
  expiresAt: iso(row.expires_at) ?? new Date(0).toISOString(),
  claimedAt: iso(row.claimed_at),
  revokedAt: iso(row.revoked_at),
});

const assertIdentifier = (
  value: string,
  name: string,
  maxLength = 240,
): string => {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > maxLength ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new SharedLiveRoomBindingStoreError(
      "binding_invalid",
      400,
      `${name} is invalid.`,
    );
  }
  return normalized;
};

export class SharedLiveRoomBindingStore {
  constructor(private readonly injectedPool?: Pool) {}

  private async pool(): Promise<Pool> {
    if (this.injectedPool) return this.injectedPool;
    await ensureDatabase();
    return getPool();
  }

  private async afterCommit(): Promise<void> {
    if (!this.injectedPool) {
      await persistLocalDatabaseSnapshotIfEnabled();
    }
  }

  async bindRunToRoom(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    roomId: string;
    now?: string;
  }): Promise<SharedLiveRoomRunRoomBinding> {
    const runId = assertIdentifier(input.runId, "runId");
    const roomId = assertIdentifier(input.roomId, "roomId");
    const now = input.now ?? new Date().toISOString();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const run = await client.query<{ run_id: string }>(
        `
          SELECT run_id
          FROM helix_agent_runs
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3
            AND subject_id = $4 AND account_profile_id = $5
          FOR UPDATE;
        `,
        [runId, ...ownerParams(input.owner)],
      );
      if (!run.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "run_not_found",
          404,
          "Agent run not found.",
        );
      }
      const existing = await client.query<RunRoomBindingRow>(
        `
          SELECT *
          FROM helix_agent_run_room_bindings
          WHERE run_id = $1 AND status = 'active'
          LIMIT 1
          FOR UPDATE;
        `,
        [runId],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].room_id === roomId) {
          await client.query("COMMIT");
          return roomBindingFromRow(existing.rows[0]);
        }
        throw new SharedLiveRoomBindingStoreError(
          "run_room_binding_conflict",
          409,
          "The run already has a different active room binding.",
        );
      }
      const membership = await client.query<{
        participant_id: string;
        member_role: string;
        room_status: string;
        consent_version: string | null;
        consent_receipt_ref: string | null;
      }>(
        `
          SELECT
            m.participant_id,
            m.member_role,
            r.status AS room_status,
            m.consent ->> 'consent_version' AS consent_version,
            m.consent ->> 'consent_receipt_ref' AS consent_receipt_ref
          FROM helix_shared_realtime_rooms r
          JOIN helix_shared_realtime_room_members m
            ON m.room_id = r.room_id
          WHERE r.room_id = $1
            AND m.profile_id = $2
            AND m.presence <> 'left'
          LIMIT 1
          FOR UPDATE;
        `,
        [roomId, input.owner.accountProfileId],
      );
      const member = membership.rows[0];
      if (!member) {
        const room = await client.query<{ room_id: string }>(
          `SELECT room_id FROM helix_shared_realtime_rooms WHERE room_id = $1;`,
          [roomId],
        );
        throw new SharedLiveRoomBindingStoreError(
          room.rows[0] ? "room_membership_required" : "room_not_found",
          404,
          "The room is unavailable to this run owner.",
        );
      }
      if (member.room_status === "closed") {
        throw new SharedLiveRoomBindingStoreError(
          "room_closed",
          410,
          "The room is closed.",
        );
      }
      const consentVersion = Number(member.consent_version ?? "0");
      const consentReceiptRef = text(member.consent_receipt_ref) || null;
      if (
        !Number.isSafeInteger(consentVersion) ||
        consentVersion < 0 ||
        (consentVersion === 0 && consentReceiptRef !== null) ||
        (consentVersion > 0 && consentReceiptRef === null)
      ) {
        throw new SharedLiveRoomBindingStoreError(
          "binding_invalid",
          409,
          "The current room membership does not have a stable consent identity.",
        );
      }
      const bindingId = `agent_room_binding:${crypto.randomUUID()}`;
      const inserted = await client.query<RunRoomBindingRow>(
        `
          INSERT INTO helix_agent_run_room_bindings (
            binding_id,
            run_id,
            tenant_id,
            issuer,
            subject_id,
            account_profile_id,
            room_id,
            authorized_by_profile_id,
            participant_id_at_bind,
            member_role_at_bind,
            consent_version_at_bind,
            consent_receipt_ref_at_bind,
            status,
            version,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $6, $8, $9,
            $10, $11, 'active', 1, $12, $12
          )
          RETURNING *;
        `,
        [
          bindingId,
          runId,
          input.owner.tenantId,
          input.owner.issuer,
          input.owner.subjectId,
          input.owner.accountProfileId,
          roomId,
          member.participant_id,
          member.member_role === "participant" ? "participant" : "owner",
          consentVersion,
          consentReceiptRef,
          now,
        ],
      );
      await client.query("COMMIT");
      await this.afterCommit();
      return roomBindingFromRow(inserted.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveRunRoomBinding(input: {
    owner: HelixAgentRunOwner;
    runId: string;
  }): Promise<SharedLiveRoomRunRoomBinding | null> {
    const pool = await this.pool();
    const { rows } = await pool.query<RunRoomBindingRow>(
      `
        SELECT *
        FROM helix_agent_run_room_bindings
        WHERE run_id = $1
          AND tenant_id = $2
          AND issuer = $3
          AND subject_id = $4
          AND account_profile_id = $5
          AND status = 'active'
        LIMIT 1;
      `,
      [assertIdentifier(input.runId, "runId"), ...ownerParams(input.owner)],
    );
    return rows[0] ? roomBindingFromRow(rows[0]) : null;
  }

  async createPendingChatBinding(input: {
    browserProfileId: string;
    chatSessionId: string;
    contextSnapshot?: SharedLiveRoomChatContextSnapshot | null;
    claimTtlMs?: number;
    now?: string;
  }): Promise<{
    binding: SharedLiveRoomRunChatBinding;
    claimHandle: string;
  }> {
    const browserProfileId = assertIdentifier(
      input.browserProfileId,
      "browserProfileId",
    );
    const chatSessionId = assertIdentifier(
      input.chatSessionId,
      "chatSessionId",
    );
    const now = input.now ?? new Date().toISOString();
    const nowMs = new Date(now).getTime();
    const ttlMs = Math.max(
      60_000,
      Math.min(30 * 60_000, Math.floor(input.claimTtlMs ?? 10 * 60_000)),
    );
    const claimExpiresAt = new Date(nowMs + ttlMs).toISOString();
    const bindingId = `agent_chat_binding:${crypto.randomUUID()}`;
    const claimHandle = `agent_chat_claim_${crypto
      .randomBytes(32)
      .toString("base64url")}`;
    const snapshot = input.contextSnapshot ?? null;
    const snapshotJson = snapshot ? JSON.stringify(snapshot) : null;
    const contextSnapshotRef = snapshotJson
      ? hashRef("agent-chat-context", snapshotJson)
      : null;
    const contextMessageCount = snapshot?.messages.length ?? 0;
    const contextCharCount =
      snapshot?.messages.reduce(
        (total, message) => total + message.content.length,
        0,
      ) ?? 0;

    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const profile = await client.query<{ profile_id: string }>(
        `
          SELECT profile_id
          FROM helix_accounts
          WHERE profile_id = $1 AND deleted_at IS NULL
          LIMIT 1;
        `,
        [browserProfileId],
      );
      if (!profile.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_owner_mismatch",
          403,
          "A trusted active browser profile is required.",
        );
      }
      const chat = await client.query<{ owner_id: string }>(
        `SELECT owner_id FROM agi_chat_sessions WHERE id = $1 LIMIT 1;`,
        [chatSessionId],
      );
      if (chat.rows[0] && chat.rows[0].owner_id !== browserProfileId) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_session_owner_mismatch",
          404,
          "The selected chat is unavailable to this browser profile.",
        );
      }
      const inserted = await client.query<RunChatBindingRow>(
        `
          INSERT INTO helix_agent_run_chat_bindings (
            binding_id,
            browser_profile_id,
            chat_session_id,
            claim_handle_hash,
            claim_expires_at,
            status,
            context_snapshot,
            context_snapshot_ref,
            context_message_count,
            context_char_count,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'pending_claim',
            $6::jsonb, $7, $8, $9, $10, $10
          )
          RETURNING *;
        `,
        [
          bindingId,
          browserProfileId,
          chatSessionId,
          hashRef("claim-handle", claimHandle),
          claimExpiresAt,
          snapshotJson,
          contextSnapshotRef,
          contextMessageCount,
          contextCharCount,
          now,
        ],
      );
      await client.query("COMMIT");
      await this.afterCommit();
      return {
        binding: chatBindingFromRow(inserted.rows[0], nowMs),
        claimHandle,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async claimPendingChatBinding(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    claimHandle: string;
    now?: string;
  }): Promise<SharedLiveRoomRunChatBinding> {
    const runId = assertIdentifier(input.runId, "runId");
    const claimHandle = assertIdentifier(input.claimHandle, "claimHandle", 500);
    const now = input.now ?? new Date().toISOString();
    const nowMs = new Date(now).getTime();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const bindingResult = await client.query<RunChatBindingRow>(
        `
          SELECT *
          FROM helix_agent_run_chat_bindings
          WHERE claim_handle_hash = $1
          LIMIT 1
          FOR UPDATE;
        `,
        [hashRef("claim-handle", claimHandle)],
      );
      const binding = bindingResult.rows[0];
      if (
        !binding ||
        binding.browser_profile_id !== input.owner.accountProfileId
      ) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Pending chat binding not found.",
        );
      }
      const effectiveStatus = effectiveChatBindingStatus(binding, nowMs);
      if (effectiveStatus === "expired") {
        await client.query(
          `
            UPDATE helix_agent_run_chat_bindings
            SET status = 'expired', updated_at = $2
            WHERE binding_id = $1 AND status = 'pending_claim';
          `,
          [binding.binding_id, now],
        );
        await client.query("COMMIT");
        await this.afterCommit();
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_expired",
          410,
          "The chat binding claim handle expired.",
        );
      }
      if (effectiveStatus === "active") {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_claimable",
          409,
          "The one-time chat binding claim handle was already consumed.",
        );
      }
      if (effectiveStatus !== "pending_claim") {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_claimable",
          409,
          "The chat binding is not claimable.",
        );
      }
      const run = await client.query<{ run_id: string }>(
        `
          SELECT run_id
          FROM helix_agent_runs
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3
            AND subject_id = $4 AND account_profile_id = $5
          FOR UPDATE;
        `,
        [runId, ...ownerParams(input.owner)],
      );
      if (!run.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "run_not_found",
          404,
          "Agent run not found.",
        );
      }
      const conflict = await client.query<{ binding_id: string }>(
        `
          SELECT binding_id
          FROM helix_agent_run_chat_bindings
          WHERE run_id = $1 AND status = 'active'
          LIMIT 1
          FOR UPDATE;
        `,
        [runId],
      );
      if (
        conflict.rows[0] &&
        conflict.rows[0].binding_id !== binding.binding_id
      ) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_conflict",
          409,
          "The run already has a different active chat binding.",
        );
      }
      const updated = await client.query<RunChatBindingRow>(
        `
          UPDATE helix_agent_run_chat_bindings
          SET run_id = $2,
              tenant_id = $3,
              issuer = $4,
              subject_id = $5,
              account_profile_id = $6,
              status = 'active',
              claimed_at = $7,
              updated_at = $7
          WHERE binding_id = $1 AND status = 'pending_claim'
          RETURNING *;
        `,
        [
          binding.binding_id,
          runId,
          input.owner.tenantId,
          input.owner.issuer,
          input.owner.subjectId,
          input.owner.accountProfileId,
          now,
        ],
      );
      if (!updated.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_claimable",
          409,
          "The chat binding claim raced with another request.",
        );
      }
      await client.query("COMMIT");
      await this.afterCommit();
      return chatBindingFromRow(updated.rows[0], nowMs);
    } catch (error) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // The expired-handle branch committed before returning its typed error.
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveRunChatBinding(input: {
    owner: HelixAgentRunOwner;
    runId: string;
  }): Promise<SharedLiveRoomRunChatBinding | null> {
    const pool = await this.pool();
    const { rows } = await pool.query<RunChatBindingRow>(
      `
        SELECT *
        FROM helix_agent_run_chat_bindings
        WHERE run_id = $1
          AND tenant_id = $2
          AND issuer = $3
          AND subject_id = $4
          AND account_profile_id = $5
          AND status = 'active'
        LIMIT 1;
      `,
      [assertIdentifier(input.runId, "runId"), ...ownerParams(input.owner)],
    );
    return rows[0] ? chatBindingFromRow(rows[0]) : null;
  }

  async getObserverBinding(input: {
    browserProfileId: string;
    bindingRef: string;
  }): Promise<SharedLiveRoomRunChatBinding | null> {
    const pool = await this.pool();
    const { rows } = await pool.query<RunChatBindingRow>(
      `
        SELECT *
        FROM helix_agent_run_chat_bindings
        WHERE binding_id = $1 AND browser_profile_id = $2
        LIMIT 1;
      `,
      [
        assertIdentifier(input.bindingRef, "bindingRef"),
        assertIdentifier(input.browserProfileId, "browserProfileId"),
      ],
    );
    return rows[0] ? chatBindingFromRow(rows[0]) : null;
  }

  async revokeObserverBinding(input: {
    browserProfileId: string;
    bindingRef: string;
    now?: string;
  }): Promise<SharedLiveRoomRunChatBinding> {
    const browserProfileId = assertIdentifier(
      input.browserProfileId,
      "browserProfileId",
    );
    const bindingRef = assertIdentifier(input.bindingRef, "bindingRef");
    const now = input.now ?? new Date().toISOString();
    const nowMs = new Date(now).getTime();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const bindingResult = await client.query<RunChatBindingRow>(
        `
          SELECT *
          FROM helix_agent_run_chat_bindings
          WHERE binding_id = $1 AND browser_profile_id = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [bindingRef, browserProfileId],
      );
      const bindingRow = bindingResult.rows[0];
      if (!bindingRow) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Observer binding not found.",
        );
      }
      if (bindingRow.status === "revoked") {
        await client.query("COMMIT");
        return chatBindingFromRow(bindingRow, nowMs);
      }
      const effectiveStatus = effectiveChatBindingStatus(bindingRow, nowMs);
      if (effectiveStatus === "expired") {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_expired",
          410,
          "The observer binding has expired.",
        );
      }
      if (effectiveStatus !== "pending_claim" && effectiveStatus !== "active") {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_claimable",
          409,
          "The observer binding cannot be disconnected.",
        );
      }
      const revoked = await client.query<RunChatBindingRow>(
        `
          UPDATE helix_agent_run_chat_bindings
          SET status = 'revoked',
              revoked_at = $3,
              revoke_reason = $4,
              updated_at = $3
          WHERE binding_id = $1
            AND browser_profile_id = $2
            AND status IN ('pending_claim', 'active')
          RETURNING *;
        `,
        [bindingRef, browserProfileId, now, OBSERVER_BINDING_REVOKE_REASON],
      );
      if (!revoked.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_claimable",
          409,
          "The observer binding could not be disconnected.",
        );
      }
      await client.query("COMMIT");
      await this.afterCommit();
      return chatBindingFromRow(revoked.rows[0], nowMs);
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // An idempotent already-revoked read may already be committed.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async listObserverEvents(input: {
    browserProfileId: string;
    bindingRef: string;
    afterSeq: number;
    limit: number;
  }): Promise<SharedLiveRoomObserverEventPage> {
    const binding = await this.getObserverBinding(input);
    if (!binding) {
      throw new SharedLiveRoomBindingStoreError(
        "chat_binding_not_found",
        404,
        "Observer binding not found.",
      );
    }
    const afterSeq = Math.max(0, Math.floor(input.afterSeq));
    const limit = Math.max(1, Math.min(200, Math.floor(input.limit)));
    if (binding.status === "pending_claim") {
      return {
        binding,
        events: [],
        nextAfterSeq: afterSeq,
        hasMore: false,
      };
    }
    if (binding.status !== "active" || !binding.runId || !binding.owner) {
      throw new SharedLiveRoomBindingStoreError(
        binding.status === "expired"
          ? "chat_binding_expired"
          : "chat_binding_not_claimable",
        410,
        "The observer binding is not active.",
      );
    }
    const pool = await this.pool();
    const { rows } = await pool.query<AgentEventRow>(
      `
        SELECT e.*
        FROM helix_agent_api_events e
        JOIN helix_agent_runs r ON r.run_id = e.run_id
        WHERE e.run_id = $1
          AND r.tenant_id = $2
          AND r.issuer = $3
          AND r.subject_id = $4
          AND r.account_profile_id = $5
          AND e.seq > $6
        ORDER BY e.seq ASC
        LIMIT $7;
      `,
      [binding.runId, ...ownerParams(binding.owner), afterSeq, limit + 1],
    );
    const hasMore = rows.length > limit;
    const events = rows.slice(0, limit).map(eventFromRow);
    return {
      binding,
      events,
      nextAfterSeq: events[events.length - 1]?.seq ?? afterSeq,
      hasMore,
    };
  }

  async revokeRunRoomBindingForOwner(input: {
    owner: HelixAgentRunOwner;
    bindingRef: string;
    now?: string;
  }): Promise<
    SharedLiveRoomBindingRevocationResult<SharedLiveRoomRunRoomBinding>
  > {
    const bindingRef = assertIdentifier(input.bindingRef, "bindingRef");
    const now = input.now ?? new Date().toISOString();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<RunRoomBindingRow>(
        `
          SELECT *
          FROM helix_agent_run_room_bindings
          WHERE binding_id = $1
            AND tenant_id = $2
            AND issuer = $3
            AND subject_id = $4
            AND account_profile_id = $5
          LIMIT 1
          FOR UPDATE;
        `,
        [bindingRef, ...ownerParams(input.owner)],
      );
      const binding = selected.rows[0];
      if (!binding) {
        throw new SharedLiveRoomBindingStoreError(
          "run_room_binding_not_found",
          404,
          "Run-room binding not found.",
        );
      }
      if (binding.status === "revoked") {
        await client.query("COMMIT");
        return {
          binding: roomBindingFromRow(binding),
          revocationStatus: "already_revoked",
        };
      }
      if (binding.status !== "active") {
        throw new SharedLiveRoomBindingStoreError(
          "run_room_binding_not_found",
          404,
          "Run-room binding not found.",
        );
      }
      const revoked = await client.query<RunRoomBindingRow>(
        `
          UPDATE helix_agent_run_room_bindings
          SET status = 'revoked',
              version = version + 1,
              revoked_at = $6,
              revoke_reason =
                'external_agent_owner_revoked_run_room_binding',
              updated_at = $6
          WHERE binding_id = $1
            AND tenant_id = $2
            AND issuer = $3
            AND subject_id = $4
            AND account_profile_id = $5
            AND status = 'active'
          RETURNING *;
        `,
        [bindingRef, ...ownerParams(input.owner), now],
      );
      if (!revoked.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "run_room_binding_not_found",
          404,
          "Run-room binding not found.",
        );
      }
      await client.query("COMMIT");
      await this.afterCommit();
      return {
        binding: roomBindingFromRow(revoked.rows[0]),
        revocationStatus: "revoked",
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // The idempotent already-revoked branch may already be committed.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeClaimedRunChatBindingForOwner(input: {
    owner: HelixAgentRunOwner;
    bindingRef: string;
    now?: string;
  }): Promise<
    SharedLiveRoomBindingRevocationResult<SharedLiveRoomRunChatBinding>
  > {
    const bindingRef = assertIdentifier(input.bindingRef, "bindingRef");
    const now = input.now ?? new Date().toISOString();
    const nowMs = new Date(now).getTime();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<RunChatBindingRow>(
        `
          SELECT *
          FROM helix_agent_run_chat_bindings
          WHERE binding_id = $1
            AND tenant_id = $2
            AND issuer = $3
            AND subject_id = $4
            AND account_profile_id = $5
          LIMIT 1
          FOR UPDATE;
        `,
        [bindingRef, ...ownerParams(input.owner)],
      );
      const binding = selected.rows[0];
      if (!binding) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Run-chat binding not found.",
        );
      }
      if (binding.status === "revoked") {
        await client.query("COMMIT");
        return {
          binding: chatBindingFromRow(binding, nowMs),
          revocationStatus: "already_revoked",
        };
      }
      if (binding.status !== "active") {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Run-chat binding not found.",
        );
      }
      const revoked = await client.query<RunChatBindingRow>(
        `
          UPDATE helix_agent_run_chat_bindings
          SET status = 'revoked',
              revoked_at = $6,
              revoke_reason =
                'external_agent_owner_revoked_run_chat_binding',
              updated_at = $6
          WHERE binding_id = $1
            AND tenant_id = $2
            AND issuer = $3
            AND subject_id = $4
            AND account_profile_id = $5
            AND status = 'active'
          RETURNING *;
        `,
        [bindingRef, ...ownerParams(input.owner), now],
      );
      if (!revoked.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Run-chat binding not found.",
        );
      }
      await client.query("COMMIT");
      await this.afterCommit();
      return {
        binding: chatBindingFromRow(revoked.rows[0], nowMs),
        revocationStatus: "revoked",
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // The idempotent already-revoked branch may already be committed.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async projectAuthorizedTerminalMessage(input: {
    browserProfileId: string;
    bindingRef: string;
    now?: string;
  }): Promise<SharedLiveRoomAuthorizedTerminalMessage | null> {
    const browserProfileId = assertIdentifier(
      input.browserProfileId,
      "browserProfileId",
    );
    const bindingRef = assertIdentifier(input.bindingRef, "bindingRef");
    const now = input.now ?? new Date().toISOString();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const bindingResult = await client.query<RunChatBindingRow>(
        `
          SELECT *
          FROM helix_agent_run_chat_bindings
          WHERE binding_id = $1 AND browser_profile_id = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [bindingRef, browserProfileId],
      );
      const bindingRow = bindingResult.rows[0];
      if (!bindingRow) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Observer binding not found.",
        );
      }
      const binding = chatBindingFromRow(bindingRow);
      if (binding.status === "pending_claim") {
        await client.query("COMMIT");
        return null;
      }
      if (binding.status !== "active" || !binding.runId || !binding.owner) {
        throw new SharedLiveRoomBindingStoreError(
          binding.status === "expired"
            ? "chat_binding_expired"
            : "chat_binding_not_claimable",
          410,
          "The observer binding is not active.",
        );
      }
      const existing = await client.query<TerminalProjectionRow>(
        `
          SELECT *
          FROM helix_agent_chat_terminal_projections
          WHERE binding_id = $1
          LIMIT 1;
        `,
        [bindingRef],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return terminalProjectionFromRow(existing.rows[0]);
      }
      const runResult = await client.query<AgentRunProjectionRow>(
        `
          SELECT
            run_id,
            version,
            lifecycle_status,
            completion_status,
            terminal_authority_status,
            evidence_bundle,
            latest_result
          FROM helix_agent_runs
          WHERE run_id = $1
            AND tenant_id = $2
            AND issuer = $3
            AND subject_id = $4
            AND account_profile_id = $5
          LIMIT 1
          FOR UPDATE;
        `,
        [binding.runId, ...ownerParams(binding.owner)],
      );
      const run = runResult.rows[0];
      if (!run) {
        throw new SharedLiveRoomBindingStoreError(
          "run_not_found",
          404,
          "Agent run not found.",
        );
      }
      if (
        run.lifecycle_status !== "completed" ||
        run.completion_status !== "completed" ||
        run.terminal_authority_status !== "authorized"
      ) {
        await client.query("COMMIT");
        return null;
      }
      const completionEvent = await client.query<{
        event_id: string;
        payload: RecordLike | string;
      }>(
        `
          SELECT event_id, payload
          FROM helix_agent_api_events
          WHERE run_id = $1 AND event_type = 'run_completed'
          ORDER BY seq DESC
          LIMIT 1;
        `,
        [binding.runId],
      );
      if (!completionEvent.rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const completionPayload = record(
        parseJson(completionEvent.rows[0].payload, {}),
      );
      const latest = record(parseJson(run.latest_result, {}));
      const terminalProduct = record(latest?.terminal_product);
      const authorityRef = text(terminalProduct?.authority_ref);
      const artifactKind = text(terminalProduct?.artifact_kind);
      const terminalText = exactText(terminalProduct?.text);
      if (
        terminalText &&
        redactSharedLiveRoomSensitiveText(terminalText).redacted
      ) {
        throw new SharedLiveRoomBindingStoreError(
          "terminal_projection_sensitive_content_rejected",
          422,
          "The verified terminal product was withheld because it contains protected credential material.",
        );
      }
      const supportRefs = stringArray(
        terminalProduct?.supporting_evidence_refs,
      );
      const evidenceBundle = record(parseJson(run.evidence_bundle, {}));
      const admittedRefs = new Set([
        ...stringArray(evidenceBundle?.observation_refs),
        ...stringArray(evidenceBundle?.evidence_refs),
        ...stringArray(evidenceBundle?.receipt_refs),
      ]);
      const verified =
        latest?.ok === true &&
        text(latest.terminal_authority_status) === "authorized" &&
        text(latest.terminal_authority_reason) ===
          "canonical_terminal_authority_verified" &&
        text(latest.terminal_authority_ref) === authorityRef &&
        !text(latest.failure_code) &&
        text(evidenceBundle?.provider_terminal_candidate_ref) ===
          authorityRef &&
        text(evidenceBundle?.terminal_authority_status) === "authorized" &&
        finiteInteger(completionPayload?.version) === Number(run.version) &&
        text(completionPayload?.lifecycle_status) === "completed" &&
        text(completionPayload?.completion_status) === "completed" &&
        supportRefs.every((ref) => admittedRefs.has(ref));
      if (
        !verified ||
        !authorityRef ||
        !artifactKind ||
        !terminalText.trim() ||
        terminalText.length > 100_000
      ) {
        await client.query("COMMIT");
        return null;
      }
      const terminalTextHash = hashRef("terminal-text", terminalText);
      const deterministicSeed = `${bindingRef}\n${authorityRef}\n${terminalTextHash}`;
      const projectionId = `agent_terminal_projection:${sha256(
        deterministicSeed,
      ).slice(0, 32)}`;
      const messageId = `agent_terminal_message:${sha256(
        deterministicSeed,
      ).slice(0, 32)}`;
      await client.query(
        `
          INSERT INTO helix_agent_chat_terminal_projections (
            projection_id,
            binding_id,
            run_id,
            authority_ref,
            terminal_text,
            terminal_text_hash,
            artifact_kind,
            supporting_evidence_refs,
            message_id,
            projected_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10
          )
          ON CONFLICT (binding_id) DO NOTHING;
        `,
        [
          projectionId,
          bindingRef,
          binding.runId,
          authorityRef,
          terminalText,
          terminalTextHash,
          artifactKind,
          JSON.stringify(supportRefs),
          messageId,
          now,
        ],
      );
      const projected = await client.query<TerminalProjectionRow>(
        `
          SELECT *
          FROM helix_agent_chat_terminal_projections
          WHERE binding_id = $1
          LIMIT 1;
        `,
        [bindingRef],
      );
      if (!projected.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "binding_invalid",
          503,
          "The terminal projection could not be persisted.",
        );
      }
      await client.query("COMMIT");
      await this.afterCommit();
      return terminalProjectionFromRow(projected.rows[0]);
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // A nonterminal branch may already have committed its read-only result.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async createCredentialDeliveryHandle(input: {
    bindingId: string;
    ownerProfileId: string;
    purpose: "create" | "rotate";
    credentialTtlMs?: number | null;
    handleTtlMs?: number;
    now?: string;
  }): Promise<{
    delivery: SharedLiveRoomCredentialDelivery;
    deliveryHandle: string;
  }> {
    const bindingId = assertIdentifier(input.bindingId, "bindingId");
    const ownerProfileId = assertIdentifier(
      input.ownerProfileId,
      "ownerProfileId",
    );
    const now = input.now ?? new Date().toISOString();
    const handleTtlMs = Math.max(
      60_000,
      Math.min(15 * 60_000, Math.floor(input.handleTtlMs ?? 5 * 60_000)),
    );
    const credentialTtlMs = Math.max(
      1,
      Math.min(
        30 * 24 * 60 * 60 * 1_000,
        Math.floor(input.credentialTtlMs ?? 7 * 24 * 60 * 60 * 1_000),
      ),
    );
    const expiresAt = new Date(
      new Date(now).getTime() + handleTtlMs,
    ).toISOString();
    const deliveryId = `room_source_delivery:${crypto.randomUUID()}`;
    const deliveryHandle = `room_source_claim_${crypto
      .randomBytes(32)
      .toString("base64url")}`;
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const source = await client.query<{
        binding_id: string;
        owner_profile_id: string;
        binding_status: string;
        room_status: string;
      }>(
        `
          SELECT
            b.binding_id,
            b.owner_profile_id,
            b.status AS binding_status,
            r.status AS room_status
          FROM helix_room_source_bindings b
          JOIN helix_shared_realtime_rooms r ON r.room_id = b.room_id
          WHERE b.binding_id = $1
          LIMIT 1
          FOR UPDATE;
        `,
        [bindingId],
      );
      const binding = source.rows[0];
      if (!binding) {
        throw new SharedLiveRoomBindingStoreError(
          "source_binding_not_found",
          404,
          "Room source binding not found.",
        );
      }
      if (
        binding.owner_profile_id !== ownerProfileId ||
        binding.binding_status !== "active"
      ) {
        throw new SharedLiveRoomBindingStoreError(
          "source_binding_owner_mismatch",
          404,
          "Room source binding not found.",
        );
      }
      if (binding.room_status === "closed") {
        throw new SharedLiveRoomBindingStoreError(
          "source_binding_closed",
          410,
          "The room source binding belongs to a closed room.",
        );
      }
      if (input.purpose === "create") {
        const activeCredential = await client.query<{
          credential_id: string;
        }>(
          `
            SELECT credential_id
            FROM helix_room_source_credentials
            WHERE binding_id = $1 AND status = 'active'
            LIMIT 1
            FOR UPDATE;
          `,
          [bindingId],
        );
        if (activeCredential.rows[0]) {
          throw new SharedLiveRoomBindingStoreError(
            "credential_delivery_not_claimable",
            409,
            "The source binding already has a credential; its one-time create delivery cannot be reissued.",
          );
        }
      }
      await client.query(
        `
          UPDATE helix_room_source_credential_deliveries
          SET status = 'revoked', revoked_at = $3, updated_at = $3
          WHERE binding_id = $1
            AND owner_profile_id = $2
            AND status = 'pending';
        `,
        [bindingId, ownerProfileId, now],
      );
      const inserted = await client.query<CredentialDeliveryRow>(
        `
          INSERT INTO helix_room_source_credential_deliveries (
            delivery_id,
            handle_hash,
            binding_id,
            owner_profile_id,
            purpose,
            credential_ttl_ms,
            status,
            created_at,
            updated_at,
            expires_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'pending', $7, $7, $8
          )
          RETURNING *;
        `,
        [
          deliveryId,
          hashRef("credential-delivery", deliveryHandle),
          bindingId,
          ownerProfileId,
          input.purpose,
          credentialTtlMs,
          now,
          expiresAt,
        ],
      );
      await client.query("COMMIT");
      await this.afterCommit();
      return {
        delivery: credentialDeliveryFromRow(inserted.rows[0]),
        deliveryHandle,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async claimCredentialDeliveryHandle(input: {
    ownerProfileId: string;
    deliveryHandle: string;
    /**
     * The callback must perform only transactional credential persistence with
     * this exact PoolClient. Any raw bearer remains owned by the trusted cookie
     * claim service and must never be logged or placed in the returned delivery
     * projection. Throwing rolls back both credential persistence and handle
     * consumption.
     */
    consume: (
      claim: SharedLiveRoomCredentialClaimPrerequisites,
      client: PoolClient,
    ) => Promise<void>;
    now?: string;
  }): Promise<SharedLiveRoomCredentialDelivery> {
    const ownerProfileId = assertIdentifier(
      input.ownerProfileId,
      "ownerProfileId",
    );
    const deliveryHandle = assertIdentifier(
      input.deliveryHandle,
      "deliveryHandle",
      500,
    );
    const now = input.now ?? new Date().toISOString();
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<
        CredentialDeliveryRow & {
          room_id: string;
          source_id: string;
          binding_owner_profile_id: string;
          binding_status: string;
          room_owner_profile_id: string;
          room_status: string;
        }
      >(
        `
          SELECT
            d.*,
            b.room_id,
            b.source_id,
            b.owner_profile_id AS binding_owner_profile_id,
            b.status AS binding_status,
            r.owner_profile_id AS room_owner_profile_id,
            r.status AS room_status
          FROM helix_room_source_credential_deliveries d
          JOIN helix_room_source_bindings b
            ON b.binding_id = d.binding_id
          JOIN helix_shared_realtime_rooms r
            ON r.room_id = b.room_id
          WHERE d.handle_hash = $1 AND d.owner_profile_id = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [hashRef("credential-delivery", deliveryHandle), ownerProfileId],
      );
      const delivery = result.rows[0];
      if (!delivery) {
        throw new SharedLiveRoomBindingStoreError(
          "credential_delivery_not_found",
          404,
          "Credential delivery handle not found.",
        );
      }
      if (
        delivery.status === "pending" &&
        new Date(delivery.expires_at).getTime() <= new Date(now).getTime()
      ) {
        const expired = await client.query<CredentialDeliveryRow>(
          `
            UPDATE helix_room_source_credential_deliveries
            SET status = 'expired', updated_at = $2
            WHERE delivery_id = $1
            RETURNING *;
          `,
          [delivery.delivery_id, now],
        );
        await client.query("COMMIT");
        await this.afterCommit();
        throw new SharedLiveRoomBindingStoreError(
          "credential_delivery_expired",
          410,
          `Credential delivery ${expired.rows[0].delivery_id} expired.`,
        );
      }
      if (delivery.status !== "pending") {
        throw new SharedLiveRoomBindingStoreError(
          "credential_delivery_not_claimable",
          409,
          "Credential delivery handle is not claimable.",
        );
      }
      if (
        delivery.binding_owner_profile_id !== ownerProfileId ||
        delivery.room_owner_profile_id !== ownerProfileId
      ) {
        throw new SharedLiveRoomBindingStoreError(
          "source_binding_owner_mismatch",
          404,
          "Room source binding not found.",
        );
      }
      if (delivery.binding_status !== "active") {
        throw new SharedLiveRoomBindingStoreError(
          "source_binding_not_found",
          410,
          "The room source binding is not active.",
        );
      }
      if (delivery.room_status === "closed") {
        throw new SharedLiveRoomBindingStoreError(
          "source_binding_closed",
          410,
          "The room source binding belongs to a closed room.",
        );
      }
      if (delivery.purpose === "create") {
        const activeCredential = await client.query<{ credential_id: string }>(
          `
            SELECT credential_id
            FROM helix_room_source_credentials
            WHERE binding_id = $1
              AND status = 'active'
              AND expires_at > $2
            LIMIT 1
            FOR UPDATE;
          `,
          [delivery.binding_id, now],
        );
        if (activeCredential.rows[0]) {
          throw new SharedLiveRoomBindingStoreError(
            "credential_delivery_not_claimable",
            409,
            "The source binding already has an active credential.",
          );
        }
      }
      await input.consume(
        {
          deliveryId: delivery.delivery_id,
          bindingId: delivery.binding_id,
          roomId: delivery.room_id,
          sourceId: delivery.source_id,
          ownerProfileId,
          purpose: delivery.purpose === "rotate" ? "rotate" : "create",
          credentialTtlMs: Number(delivery.credential_ttl_ms),
          claimedAt: now,
        },
        client,
      );
      const claimed = await client.query<CredentialDeliveryRow>(
        `
          UPDATE helix_room_source_credential_deliveries
          SET status = 'claimed',
              claimed_at = $2,
              updated_at = $2
          WHERE delivery_id = $1 AND status = 'pending'
          RETURNING *;
        `,
        [delivery.delivery_id, now],
      );
      if (!claimed.rows[0]) {
        throw new SharedLiveRoomBindingStoreError(
          "credential_delivery_not_claimable",
          409,
          "Credential delivery claim raced with another request.",
        );
      }
      await client.query("COMMIT");
      await this.afterCommit();
      return credentialDeliveryFromRow(claimed.rows[0]);
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // An expiry branch may already have committed its typed state.
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
