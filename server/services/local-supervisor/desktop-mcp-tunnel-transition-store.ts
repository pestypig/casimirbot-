import crypto from "node:crypto";
import {
  HELIX_DESKTOP_TUNNEL_TRANSITION_RECEIPT_SCHEMA,
  HELIX_DESKTOP_TUNNEL_TRANSITION_SCHEMA,
  type DesktopMcpTransitionIdentity,
  type DesktopMcpTransitionReceipt,
  type DesktopMcpTransitionRequest,
  type DesktopMcpTransitionTarget,
} from "@shared/desktop-mcp-tunnel-transition";

type PrivateRecord = {
  request: DesktopMcpTransitionRequest;
  requesterAccountSessionHash: string;
  delegationAccountSessionHash: string | null;
  delegationAccountSessionId: string | null;
  idempotencyReceipts: Map<string, DesktopMcpTransitionReceipt>;
};

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");
const clone = <T>(value: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T;

export class DesktopMcpTunnelTransitionError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = "DesktopMcpTunnelTransitionError";
  }
}

export class DesktopMcpTunnelTransitionStore {
  private readonly records = new Map<string, PrivateRecord>();
  private readonly receipts: DesktopMcpTransitionReceipt[] = [];
  private sequence = 0;

  constructor(
    readonly serviceInstanceRef: string,
    private readonly now: () => Date = () => new Date(),
    private readonly newRef: (kind: "request" | "delegation" | "receipt") => string =
      (kind) => `desktop_tunnel_${kind}:${crypto.randomUUID()}`,
    private readonly maxRecords = 256,
  ) {
    if (!Number.isInteger(maxRecords) || maxRecords < 8 || maxRecords > 2_048) {
      throw new Error("Desktop MCP transition capacity must be 8-2048.");
    }
  }

  private sessionHash(value: string): string {
    return digest(value);
  }

  private expire(record: PrivateRecord): void {
    const request = record.request;
    if (
      (request.status === "delegated" ||
        request.status === "transition_accepted" ||
        request.status === "active") &&
      request.delegation_expires_at &&
      Date.parse(request.delegation_expires_at) <= this.now().getTime()
    ) {
      this.update(record, "expired");
      this.append(record, "expired", "full_helix_agent", "delegation_expired");
    }
  }

  private requireOwned(
    requestRef: string,
    identity: DesktopMcpTransitionIdentity,
  ): PrivateRecord {
    const record = this.records.get(requestRef);
    if (!record) {
      throw new DesktopMcpTunnelTransitionError("transition_request_not_found", 404);
    }
    const request = record.request;
    if (
      request.service_instance_ref !== identity.serviceInstanceRef ||
      request.client_session_ref !== identity.clientSessionRef ||
      request.conversation_thread_ref !== identity.conversationThreadRef ||
      request.authenticated_profile_ref !== identity.authenticatedProfileRef ||
      request.authenticated_mcp_client_ref !== identity.authenticatedMcpClientRef ||
      record.requesterAccountSessionHash !==
        this.sessionHash(identity.accountSessionId)
    ) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_client_identity_mismatch",
        403,
      );
    }
    this.expire(record);
    return record;
  }

  private update(
    record: PrivateRecord,
    status: DesktopMcpTransitionRequest["status"],
    extra: Partial<DesktopMcpTransitionRequest> = {},
  ): DesktopMcpTransitionRequest {
    record.request = Object.freeze({
      ...record.request,
      ...extra,
      status,
      updated_at: this.now().toISOString(),
    });
    return clone(record.request);
  }

  private append(
    record: PrivateRecord,
    eventType: DesktopMcpTransitionReceipt["event_type"],
    targetScope: DesktopMcpTransitionTarget,
    reasonCode: string,
  ): DesktopMcpTransitionReceipt {
    const previousReceiptHash = this.receipts.at(-1)?.receipt_hash ?? null;
    const receiptRef = this.newRef("receipt");
    const sequence = ++this.sequence;
    const observedAt = this.now().toISOString();
    const receiptHash = digest(JSON.stringify({
      schema: HELIX_DESKTOP_TUNNEL_TRANSITION_RECEIPT_SCHEMA,
      receipt_ref: receiptRef,
      sequence,
      transition_request_ref: record.request.transition_request_ref,
      delegation_ref: record.request.delegation_ref,
      service_instance_ref: this.serviceInstanceRef,
      client_session_ref: record.request.client_session_ref,
      event_type: eventType,
      target_scope: targetScope,
      reason_code: reasonCode,
      observed_at: observedAt,
      previous_receipt_hash: previousReceiptHash,
    }));
    const receipt: DesktopMcpTransitionReceipt = Object.freeze({
      schema: HELIX_DESKTOP_TUNNEL_TRANSITION_RECEIPT_SCHEMA,
      receipt_ref: receiptRef,
      sequence,
      transition_request_ref: record.request.transition_request_ref,
      delegation_ref: record.request.delegation_ref,
      service_instance_ref: this.serviceInstanceRef,
      client_session_ref: record.request.client_session_ref,
      event_type: eventType,
      target_scope: targetScope,
      reason_code: reasonCode,
      observed_at: observedAt,
      previous_receipt_hash: previousReceiptHash,
      receipt_hash: receiptHash,
      client_identity_assurance: record.request.client_identity_assurance,
      independent_external_oauth_client_bound:
        record.request.independent_external_oauth_client_bound,
      immutable_event: true,
      authority_limited_to_tunnel_transport: true,
      environment_authority_granted: false,
      trading_authority_granted: false,
      credential_included: false,
      private_endpoint_included: false,
      hidden_reasoning_included: false,
      content_role: "desktop_tunnel_transition_receipt_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    this.receipts.push(receipt);
    return clone(receipt);
  }

  request(input: {
    identity: DesktopMcpTransitionIdentity;
    declaredTaskSummary: string;
    requestedLeaseSeconds: number;
  }): { request: DesktopMcpTransitionRequest; receipt: DesktopMcpTransitionReceipt } {
    if (input.identity.serviceInstanceRef !== this.serviceInstanceRef) {
      throw new DesktopMcpTunnelTransitionError("transition_service_epoch_mismatch", 409);
    }
    for (const record of this.records.values()) this.expire(record);
    const open = [...this.records.values()].find((record) =>
      record.request.client_session_ref === input.identity.clientSessionRef &&
      record.request.conversation_thread_ref ===
        input.identity.conversationThreadRef &&
      [
        "pending_user_delegation",
        "delegated",
        "transition_accepted",
        "active",
      ].includes(record.request.status));
    if (open) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_request_already_open",
        409,
      );
    }
    if (this.records.size >= this.maxRecords) {
      const reclaimable = [...this.records.values()]
        .filter((record) => [
          "returned_read_only",
          "revoked",
          "expired",
          "failed",
        ].includes(record.request.status))
        .sort((left, right) =>
          left.request.updated_at.localeCompare(right.request.updated_at));
      for (const record of reclaimable) {
        this.records.delete(record.request.transition_request_ref);
        if (this.records.size < this.maxRecords) break;
      }
      if (this.records.size >= this.maxRecords) {
        throw new DesktopMcpTunnelTransitionError(
          "transition_request_capacity_reached",
          429,
        );
      }
    }
    const createdAt = this.now().toISOString();
    const request: DesktopMcpTransitionRequest = Object.freeze({
      schema: HELIX_DESKTOP_TUNNEL_TRANSITION_SCHEMA,
      transition_request_ref: this.newRef("request"),
      service_instance_ref: this.serviceInstanceRef,
      client_session_ref: input.identity.clientSessionRef,
      conversation_thread_ref: input.identity.conversationThreadRef,
      authenticated_profile_ref: input.identity.authenticatedProfileRef,
      authenticated_mcp_client_ref: input.identity.authenticatedMcpClientRef,
      declared_task_summary: input.declaredTaskSummary,
      declared_task_is_verified: false,
      requested_scope: "full_helix_agent",
      requested_lease_seconds: input.requestedLeaseSeconds,
      status: "pending_user_delegation",
      delegation_ref: null,
      delegation_expires_at: null,
      created_at: createdAt,
      updated_at: createdAt,
      client_identity_assurance: input.identity.clientIdentityAssurance,
      independent_external_oauth_client_bound:
        input.identity.independentExternalOAuthClientBound,
      authority_limited_to_tunnel_transport: true,
      environment_authority_granted: false,
      trading_authority_granted: false,
      credential_included: false,
      private_endpoint_included: false,
      content_role: "desktop_tunnel_transition_request_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    const record: PrivateRecord = {
      request,
      requesterAccountSessionHash:
        this.sessionHash(input.identity.accountSessionId),
      delegationAccountSessionHash: null,
      delegationAccountSessionId: null,
      idempotencyReceipts: new Map(),
    };
    this.records.set(request.transition_request_ref, record);
    return { request: clone(request), receipt: this.append(record, "requested", "full_helix_agent", "user_delegation_required") };
  }

  inspect(input: {
    identity: DesktopMcpTransitionIdentity;
    requestRef: string;
  }): DesktopMcpTransitionRequest {
    return clone(this.requireOwned(input.requestRef, input.identity).request);
  }

  grant(input: {
    requestRef: string;
    authenticatedProfileRef: string;
    accountSessionId: string;
    accountType: "developer" | "user";
    leaseSeconds?: number;
  }): { request: DesktopMcpTransitionRequest; receipt: DesktopMcpTransitionReceipt } {
    const record = this.records.get(input.requestRef);
    if (!record) throw new DesktopMcpTunnelTransitionError("transition_request_not_found", 404);
    if (
      input.accountType !== "developer" ||
      input.authenticatedProfileRef !== record.request.authenticated_profile_ref
    ) throw new DesktopMcpTunnelTransitionError("transition_delegation_forbidden", 403);
    if (record.request.status !== "pending_user_delegation") {
      throw new DesktopMcpTunnelTransitionError("transition_request_not_pending", 409);
    }
    const leaseSeconds = input.leaseSeconds ?? record.request.requested_lease_seconds;
    if (!Number.isInteger(leaseSeconds) || leaseSeconds < 30 || leaseSeconds > 300) {
      throw new DesktopMcpTunnelTransitionError("transition_lease_invalid", 400);
    }
    record.delegationAccountSessionHash =
      this.sessionHash(input.accountSessionId);
    record.delegationAccountSessionId = input.accountSessionId;
    const request = this.update(record, "delegated", {
      delegation_ref: this.newRef("delegation"),
      delegation_expires_at: new Date(this.now().getTime() + leaseSeconds * 1000).toISOString(),
    });
    return { request, receipt: this.append(record, "delegated", "full_helix_agent", "developer_delegation_granted") };
  }

  authorize(input: {
    identity: DesktopMcpTransitionIdentity;
    requestRef: string;
    targetScope: DesktopMcpTransitionTarget;
    idempotencyKey: string;
  }): Readonly<{
    receipt: DesktopMcpTransitionReceipt;
    idempotencyReplayed: boolean;
    delegatedAccountSessionId: string;
  }> {
    const record = this.requireOwned(input.requestRef, input.identity);
    if (!record.delegationAccountSessionId) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_delegation_not_active",
        409,
      );
    }
    const replay = record.idempotencyReceipts.get(input.idempotencyKey);
    if (replay) {
      if (replay.target_scope !== input.targetScope) {
        throw new DesktopMcpTunnelTransitionError(
          "transition_idempotency_conflict",
          409,
        );
      }
      if (
        record.request.status !== "transition_accepted" &&
        record.request.status !== "active"
      ) {
        throw new DesktopMcpTunnelTransitionError(
          "transition_delegation_not_active",
          409,
        );
      }
      return Object.freeze({
        receipt: clone(replay),
        idempotencyReplayed: true,
        delegatedAccountSessionId: record.delegationAccountSessionId,
      });
    }
    const startFull = input.targetScope === "full_helix_agent";
    const statusAllowsTransition = startFull
      ? record.request.status === "delegated"
      : record.request.status === "delegated" ||
        record.request.status === "transition_accepted" ||
        record.request.status === "active";
    if (!statusAllowsTransition) {
      throw new DesktopMcpTunnelTransitionError("transition_delegation_not_active", 409);
    }
    this.update(record, "transition_accepted");
    const receipt = this.append(record, "transition_accepted", input.targetScope, "native_transition_pending");
    record.idempotencyReceipts.set(input.idempotencyKey, receipt);
    return Object.freeze({
      receipt,
      idempotencyReplayed: false,
      delegatedAccountSessionId: record.delegationAccountSessionId,
    });
  }

  settle(input: {
    requestRef: string;
    eventType: "active" | "returned_read_only" | "failed";
    reasonCode: string;
  }): DesktopMcpTransitionReceipt {
    const record = this.records.get(input.requestRef);
    if (!record) throw new DesktopMcpTunnelTransitionError("transition_request_not_found", 404);
    const target = input.eventType === "active"
      ? "full_helix_agent"
      : "local_supervisor_coordination_and_device_check";
    this.update(record, input.eventType);
    return this.append(record, input.eventType, target, input.reasonCode);
  }

  revoke(input: {
    requestRef: string;
    authenticatedProfileRef: string;
    accountSessionId: string;
    reasonCode?: string;
  }): DesktopMcpTransitionReceipt {
    const record = this.records.get(input.requestRef);
    if (!record) throw new DesktopMcpTunnelTransitionError("transition_request_not_found", 404);
    if (
      input.authenticatedProfileRef !== record.request.authenticated_profile_ref ||
      this.sessionHash(input.accountSessionId) !==
        (record.delegationAccountSessionHash ??
          record.requesterAccountSessionHash)
    ) {
      throw new DesktopMcpTunnelTransitionError("transition_revocation_forbidden", 403);
    }
    this.update(record, "revoked");
    return this.append(record, "revoked", "local_supervisor_coordination_and_device_check", input.reasonCode ?? "developer_revoked");
  }

  listReceipts(requestRef: string): DesktopMcpTransitionReceipt[] {
    return this.receipts
      .filter((receipt) => receipt.transition_request_ref === requestRef)
      .map(clone);
  }

  listForAccount(input: {
    authenticatedProfileRef: string;
    accountSessionId: string;
  }): DesktopMcpTransitionRequest[] {
    const sessionHash = this.sessionHash(input.accountSessionId);
    return [...this.records.values()]
      .filter((record) =>
        record.request.authenticated_profile_ref === input.authenticatedProfileRef &&
        (record.delegationAccountSessionHash === null ||
          record.delegationAccountSessionHash === sessionHash))
      .map((record) => {
        this.expire(record);
        return clone(record.request);
      })
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  revokeAllForSafety(reasonCode: "environment_emergency_stop"): Array<{
    transitionRequestRef: string;
    delegationRef: string;
    delegationExpiresAt: string;
    accountSessionId: string;
  }> {
    const actions: Array<{
      transitionRequestRef: string;
      delegationRef: string;
      delegationExpiresAt: string;
      accountSessionId: string;
    }> = [];
    for (const record of this.records.values()) {
      this.expire(record);
      if (![
        "pending_user_delegation",
        "delegated",
        "transition_accepted",
        "active",
      ].includes(record.request.status)) continue;
      const delegationRef = record.request.delegation_ref;
      const delegationExpiresAt = record.request.delegation_expires_at;
      this.update(record, "revoked");
      this.append(
        record,
        "revoked",
        "local_supervisor_coordination_and_device_check",
        reasonCode,
      );
      if (delegationRef && delegationExpiresAt) {
        actions.push({
          transitionRequestRef: record.request.transition_request_ref,
          delegationRef,
          delegationExpiresAt,
          accountSessionId: record.delegationAccountSessionId!,
        });
      }
    }
    return actions;
  }
}
