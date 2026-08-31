import type { Pool } from "pg";

import {
  helixMcpEvidenceObservationSchema,
  type HelixMcpEvidenceObservation,
} from "@shared/contracts/helix-mcp-evidence-capability.v1";
import { helixMcpEvidenceSha256 } from "./observation";

export type HelixMcpEvidenceOwner = Readonly<{
  tenantId: string;
  accountProfileId: string;
}>;

export type HelixMcpEvidenceRetrievalFailureCode =
  | "observation_not_found"
  | "observation_identity_conflict"
  | "observation_owner_mismatch"
  | "observation_expired"
  | "observation_stale"
  | "observation_revoked"
  | "observation_corrupt";

export class HelixMcpEvidenceObservationStoreError extends Error {
  constructor(
    readonly code: HelixMcpEvidenceRetrievalFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "HelixMcpEvidenceObservationStoreError";
  }
}

type ObservationRow = {
  tenant_id: string;
  account_profile_id: string;
  observation: unknown;
  payload_sha256: string;
  retained_until: Date | string;
  revoked_at: Date | string | null;
};

export class HelixMcpEvidenceObservationStore {
  constructor(private readonly dependencies: Readonly<{
    pool?: Pool;
    poolProvider?: () => Promise<Pool>;
    now?: () => Date;
    persist?: () => Promise<void>;
  }> = {}) {}

  private async pool(): Promise<Pool> {
    if (this.dependencies.pool) return this.dependencies.pool;
    if (this.dependencies.poolProvider) return this.dependencies.poolProvider();
    throw new Error("mcp_evidence_observation_store_pool_unavailable");
  }

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private async persist(): Promise<void> {
    if (this.dependencies.persist) return this.dependencies.persist();
  }

  async put(input: {
    owner: HelixMcpEvidenceOwner;
    toolName: string;
    observation: HelixMcpEvidenceObservation;
  }): Promise<void> {
    const observation = helixMcpEvidenceObservationSchema.parse(input.observation);
    if (!observation.retention.retrieval_allowed || !observation.retention.retained_until) {
      throw new Error("mcp_evidence_observation_not_durable");
    }
    const pool = await this.pool();
    const assertReplayCompatible = (row: {
      tenant_id: string;
      account_profile_id: string;
      payload_sha256: string;
    } | undefined): void => {
      if (!row || row.tenant_id !== input.owner.tenantId ||
          row.account_profile_id !== input.owner.accountProfileId ||
          row.payload_sha256 !== observation.provenance.payload_sha256) {
        throw new HelixMcpEvidenceObservationStoreError(
          "observation_identity_conflict",
          "The MCP evidence observation reference is already bound to different evidence.",
        );
      }
    };
    const prior = await pool.query<{
      tenant_id: string;
      account_profile_id: string;
      payload_sha256: string;
    }>(
      `SELECT tenant_id, account_profile_id, payload_sha256
       FROM helix_mcp_evidence_observations WHERE observation_ref = $1 LIMIT 1;`,
      [observation.observation_ref],
    );
    if (prior.rows[0]) {
      assertReplayCompatible(prior.rows[0]);
      return;
    }
    const inserted = await pool.query<{ observation_ref: string }>(
      `INSERT INTO helix_mcp_evidence_observations (
         observation_ref, tenant_id, account_profile_id, capability_id,
         tool_name, observation, payload_sha256, observed_at, retained_until
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
       ON CONFLICT (observation_ref) DO NOTHING
       RETURNING observation_ref;`,
      [
        observation.observation_ref,
        input.owner.tenantId,
        input.owner.accountProfileId,
        observation.capability_id,
        input.toolName,
        JSON.stringify(observation),
        observation.provenance.payload_sha256,
        observation.observed_at,
        observation.retention.retained_until,
      ],
    );
    if (!inserted.rows[0]) {
      const existing = await pool.query<{
        tenant_id: string;
        account_profile_id: string;
        payload_sha256: string;
      }>(
        `SELECT tenant_id, account_profile_id, payload_sha256
         FROM helix_mcp_evidence_observations WHERE observation_ref = $1 LIMIT 1;`,
        [observation.observation_ref],
      );
      const row = existing.rows[0];
      assertReplayCompatible(row);
      return;
    }
    await this.persist();
  }

  async get(input: {
    owner: HelixMcpEvidenceOwner;
    observationRef: string;
  }): Promise<HelixMcpEvidenceObservation> {
    const pool = await this.pool();
    const { rows } = await pool.query<ObservationRow>(
      `SELECT tenant_id, account_profile_id, observation, payload_sha256,
              retained_until, revoked_at
       FROM helix_mcp_evidence_observations WHERE observation_ref = $1 LIMIT 1;`,
      [input.observationRef],
    );
    const row = rows[0];
    if (!row) throw new HelixMcpEvidenceObservationStoreError(
      "observation_not_found", "The MCP evidence observation does not exist.",
    );
    if (row.tenant_id !== input.owner.tenantId ||
        row.account_profile_id !== input.owner.accountProfileId) {
      throw new HelixMcpEvidenceObservationStoreError(
        "observation_owner_mismatch", "The MCP evidence observation belongs to another owner.",
      );
    }
    if (row.revoked_at !== null) throw new HelixMcpEvidenceObservationStoreError(
      "observation_revoked", "The MCP evidence observation was revoked.",
    );
    if (new Date(row.retained_until).getTime() <= this.now().getTime()) {
      throw new HelixMcpEvidenceObservationStoreError(
        "observation_expired", "The MCP evidence observation retention window expired.",
      );
    }
    const parsed = helixMcpEvidenceObservationSchema.safeParse(row.observation);
    if (!parsed.success ||
        parsed.data.provenance.payload_sha256 !== row.payload_sha256 ||
        helixMcpEvidenceSha256(parsed.data.payload) !== row.payload_sha256) {
      throw new HelixMcpEvidenceObservationStoreError(
        "observation_corrupt", "The MCP evidence observation failed integrity validation.",
      );
    }
    if (parsed.data.freshness.state === "stale" ||
        (parsed.data.freshness.expires_at !== null &&
         new Date(parsed.data.freshness.expires_at).getTime() <= this.now().getTime())) {
      throw new HelixMcpEvidenceObservationStoreError(
        "observation_stale", "The MCP evidence observation is no longer fresh enough for re-entry.",
      );
    }
    return parsed.data;
  }

  async revoke(input: {
    owner: HelixMcpEvidenceOwner;
    observationRef: string;
    revocationRef: string;
  }): Promise<boolean> {
    const pool = await this.pool();
    const result = await pool.query(
      `UPDATE helix_mcp_evidence_observations
       SET revoked_at = $1, revocation_ref = $2
       WHERE observation_ref = $3 AND tenant_id = $4 AND account_profile_id = $5
         AND revoked_at IS NULL;`,
      [this.now().toISOString(), input.revocationRef, input.observationRef,
        input.owner.tenantId, input.owner.accountProfileId],
    );
    if ((result.rowCount ?? 0) > 0) await this.persist();
    return (result.rowCount ?? 0) > 0;
  }
}
