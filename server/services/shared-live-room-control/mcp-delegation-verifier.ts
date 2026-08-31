import {
  validateHelixSharedLiveRoomMcpDelegationIntegrityV1,
  type HelixSharedLiveRoomMcpDelegationBindingV1,
  type HelixSharedLiveRoomMcpDelegationReceiptV1,
} from "@shared/contracts/helix-shared-live-room-mcp-delegation.v1";

export type SharedLiveRoomMcpDelegationAuthenticityVerifier = (input: {
  receipt: HelixSharedLiveRoomMcpDelegationReceiptV1;
  signedPayloadSha256: string;
}) => Promise<{ ok: boolean; issues?: string[] }> | { ok: boolean; issues?: string[] };

export type SharedLiveRoomMcpDelegationReplayLedger = {
  consumeOnce(input: {
    receiptId: string;
    requestId: string;
    issuer: string;
    keyId: string;
    bindingSha256: string;
    artifactSha256: string;
    signedPayloadSha256: string;
    delegatedAt: string;
    expiresAt: string;
  }): Promise<{ status: "consumed" | "already_consumed" | "unavailable" }> |
    { status: "consumed" | "already_consumed" | "unavailable" };
};

export type SharedLiveRoomMcpDelegationConsumeResult =
  | { ok: true; delegationRef: string; requestRef: string; issues: [] }
  | { ok: false; delegationRef: string | null; requestRef: string | null; issues: string[] };

const sameBinding = (
  actual: HelixSharedLiveRoomMcpDelegationBindingV1,
  expected: HelixSharedLiveRoomMcpDelegationBindingV1,
): string[] => (Object.keys(expected) as Array<keyof HelixSharedLiveRoomMcpDelegationBindingV1>)
  .filter((field) => actual[field] !== expected[field])
  .map((field) => `room_mcp_delegation_binding_mismatch:${field}`);

export const createSharedLiveRoomMcpDelegationVerifier = (input: {
  verifyAuthenticity?: SharedLiveRoomMcpDelegationAuthenticityVerifier;
  replayLedger?: SharedLiveRoomMcpDelegationReplayLedger;
  now?: () => number;
  maxLifetimeMs?: number;
  futureClockSkewMs?: number;
}) => ({
  consume: async (args: {
    receipt: unknown;
    expectedBinding: HelixSharedLiveRoomMcpDelegationBindingV1;
  }): Promise<SharedLiveRoomMcpDelegationConsumeResult> => {
    const raw = args.receipt && typeof args.receipt === "object" && !Array.isArray(args.receipt)
      ? args.receipt as Record<string, unknown>
      : null;
    const delegationRef = typeof raw?.receiptId === "string" ? raw.receiptId : null;
    const request = raw?.request && typeof raw.request === "object" && !Array.isArray(raw.request)
      ? raw.request as Record<string, unknown>
      : null;
    const requestRef = typeof request?.requestId === "string" ? request.requestId : null;
    if (!raw) return { ok: false, delegationRef, requestRef, issues: ["room_mcp_delegation_required"] };
    if (!input.verifyAuthenticity) return { ok: false, delegationRef, requestRef, issues: ["room_mcp_delegation_issuer_unconfigured"] };
    if (!input.replayLedger) return { ok: false, delegationRef, requestRef, issues: ["room_mcp_delegation_replay_ledger_unconfigured"] };
    const integrityIssues = await validateHelixSharedLiveRoomMcpDelegationIntegrityV1(raw);
    if (integrityIssues.length) return { ok: false, delegationRef, requestRef, issues: integrityIssues };
    const receipt = raw as HelixSharedLiveRoomMcpDelegationReceiptV1;
    const bindingIssues = sameBinding(receipt.request.binding, args.expectedBinding);
    if (bindingIssues.length) return { ok: false, delegationRef, requestRef, issues: bindingIssues };
    const issuedAt = Date.parse(receipt.request.issuedAt);
    const delegatedAt = Date.parse(receipt.delegatedAt);
    const expiresAt = Date.parse(receipt.request.expiresAt);
    const now = (input.now ?? Date.now)();
    const timing: string[] = [];
    if (expiresAt <= issuedAt) timing.push("room_mcp_delegation_invalid_lifetime");
    if (expiresAt - issuedAt > (input.maxLifetimeMs ?? 5 * 60_000)) timing.push("room_mcp_delegation_lifetime_exceeds_policy");
    if (issuedAt > now + (input.futureClockSkewMs ?? 30_000)) timing.push("room_mcp_delegation_issued_in_future");
    if (delegatedAt < issuedAt || delegatedAt > expiresAt) timing.push("room_mcp_delegation_time_out_of_range");
    if (now >= expiresAt) timing.push("room_mcp_delegation_expired");
    if (timing.length) return { ok: false, delegationRef, requestRef, issues: timing };
    let authentic: { ok: boolean; issues?: string[] };
    try {
      authentic = await input.verifyAuthenticity({ receipt, signedPayloadSha256: receipt.signedPayloadSha256 });
    } catch {
      authentic = { ok: false, issues: ["room_mcp_delegation_verifier_failed"] };
    }
    if (!authentic.ok) return { ok: false, delegationRef, requestRef, issues: authentic.issues?.length ? [...new Set(authentic.issues)] : ["room_mcp_delegation_signature_invalid"] };
    let consumed: { status: "consumed" | "already_consumed" | "unavailable" };
    try {
      consumed = await input.replayLedger.consumeOnce({
        receiptId: receipt.receiptId,
        requestId: receipt.request.requestId,
        issuer: receipt.issuer,
        keyId: receipt.keyId,
        bindingSha256: receipt.request.bindingSha256,
        artifactSha256: receipt.artifactSha256,
        signedPayloadSha256: receipt.signedPayloadSha256,
        delegatedAt: receipt.delegatedAt,
        expiresAt: receipt.request.expiresAt,
      });
    } catch {
      consumed = { status: "unavailable" };
    }
    if (consumed.status === "already_consumed") return { ok: false, delegationRef, requestRef, issues: ["room_mcp_delegation_already_consumed"] };
    if (consumed.status !== "consumed") return { ok: false, delegationRef, requestRef, issues: ["room_mcp_delegation_replay_ledger_unavailable"] };
    return { ok: true, delegationRef: receipt.receiptId, requestRef: receipt.request.requestId, issues: [] };
  },
});

export type SharedLiveRoomMcpDelegationVerifier = ReturnType<typeof createSharedLiveRoomMcpDelegationVerifier>;
