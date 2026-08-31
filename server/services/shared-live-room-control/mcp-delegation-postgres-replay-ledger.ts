import type { Pool } from "pg";
import { ensureDatabase, getPool } from "../../db/client";
import type { SharedLiveRoomMcpDelegationReplayLedger } from "./mcp-delegation-verifier";

export class PostgresSharedLiveRoomMcpDelegationReplayLedger implements SharedLiveRoomMcpDelegationReplayLedger {
  constructor(private readonly injectedPool?: Pool) {}

  async consumeOnce(claim: Parameters<SharedLiveRoomMcpDelegationReplayLedger["consumeOnce"]>[0]): Promise<{ status: "consumed" | "already_consumed" | "unavailable" }> {
    if (!claim.receiptId?.trim() || !claim.requestId?.trim() || !/^[a-f0-9]{64}$/.test(claim.bindingSha256) || !/^[a-f0-9]{64}$/.test(claim.artifactSha256) || !/^[a-f0-9]{64}$/.test(claim.signedPayloadSha256)) return { status: "unavailable" };
    try {
      if (!this.injectedPool) await ensureDatabase();
      const pool = this.injectedPool ?? getPool();
      const result = await pool.query<{ receipt_id: string }>(`
        INSERT INTO helix_shared_live_room_mcp_delegation_replay_claims (
          receipt_id, request_id, issuer, key_id, binding_sha256,
          artifact_sha256, signed_payload_sha256, delegated_at, expires_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::timestamptz,$9::timestamptz)
        ON CONFLICT DO NOTHING RETURNING receipt_id
      `, [claim.receiptId, claim.requestId, claim.issuer, claim.keyId, claim.bindingSha256, claim.artifactSha256, claim.signedPayloadSha256, claim.delegatedAt, claim.expiresAt]);
      return result.rows.length === 1 ? { status: "consumed" } : result.rows.length === 0 ? { status: "already_consumed" } : { status: "unavailable" };
    } catch {
      return { status: "unavailable" };
    }
  }
}
