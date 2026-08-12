import type { Migration } from "./migration";

export const migration053: Migration = {
  id: "053_live_equity_order_previews",
  description:
    "Add expiring Robinhood equity reviews and exact one-time explicit-user approvals without placement authority",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_equity_order_previews (
        preview_id text PRIMARY KEY,
        client_preview_id text NOT NULL,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        paper_account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        risk_decision_id text NOT NULL REFERENCES helix_paper_risk_decisions(decision_id) ON DELETE RESTRICT,
        source_observation_id text NOT NULL REFERENCES helix_brokerage_read_audit(observation_id) ON DELETE RESTRICT,
        proposal_hash text NOT NULL,
        provider_review_hash text NOT NULL,
        provider_contract_hash text NOT NULL,
        intent_json jsonb NOT NULL,
        provider_review_public_json jsonb NOT NULL,
        encrypted_provider_review text NOT NULL,
        provider_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
        approval_phrase text NOT NULL,
        status text NOT NULL DEFAULT 'reviewed',
        reviewed_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        invalidated_at timestamptz,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (proposal_hash LIKE 'sha256:%'),
        CHECK (provider_review_hash LIKE 'sha256:%'),
        CHECK (provider_contract_hash LIKE 'sha256:%'),
        CHECK (status IN ('reviewed', 'approved', 'expired', 'consumed', 'invalidated')),
        CHECK (expires_at > reviewed_at),
        UNIQUE (owner_profile_id, client_preview_id),
        UNIQUE (owner_profile_id, risk_decision_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_equity_order_previews_room_idx
      ON helix_live_equity_order_previews
        (owner_profile_id, room_id, reviewed_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_equity_order_approvals (
        approval_id text PRIMARY KEY,
        preview_id text NOT NULL UNIQUE REFERENCES helix_live_equity_order_previews(preview_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        session_hash text NOT NULL,
        proposal_hash text NOT NULL,
        provider_review_hash text NOT NULL,
        decision_source text NOT NULL DEFAULT 'explicit_user',
        approved_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (session_hash LIKE 'sha256:%'),
        CHECK (proposal_hash LIKE 'sha256:%'),
        CHECK (provider_review_hash LIKE 'sha256:%'),
        CHECK (decision_source = 'explicit_user'),
        CHECK (expires_at > approved_at)
      );
    `);
  },
};
