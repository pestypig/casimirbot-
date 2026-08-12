import type { Migration } from "./migration";

export const migration051: Migration = {
  id: "051_paper_trading_risk_journal",
  description:
    "Add owner-private paper trading accounts, deterministic risk decisions, and kill-switch audit events",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_trading_accounts (
        account_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        policy_json jsonb NOT NULL,
        policy_hash text NOT NULL,
        starting_equity_cents integer NOT NULL,
        account_equity_cents integer NOT NULL,
        buying_power_cents integer NOT NULL,
        realized_pnl_cents integer NOT NULL DEFAULT 0,
        unrealized_pnl_cents integer NOT NULL DEFAULT 0,
        trading_day date NOT NULL,
        new_trades_today integer NOT NULL DEFAULT 0,
        open_symbols jsonb NOT NULL DEFAULT '[]'::jsonb,
        consecutive_losses integer NOT NULL DEFAULT 0,
        kill_switch_active boolean NOT NULL DEFAULT false,
        kill_switch_reason text,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (policy_hash LIKE 'sha256:%'),
        CHECK (starting_equity_cents > 0),
        CHECK (account_equity_cents >= 0),
        CHECK (buying_power_cents >= 0),
        CHECK (new_trades_today >= 0),
        CHECK (consecutive_losses >= 0),
        CHECK (status IN ('active', 'archived')),
        CHECK (
          (kill_switch_active = false AND kill_switch_reason IS NULL) OR
          (kill_switch_active = true AND kill_switch_reason IS NOT NULL)
        )
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_paper_trading_accounts_active_idx
      ON helix_paper_trading_accounts (owner_profile_id, connection_id, room_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_risk_decisions (
        decision_id text PRIMARY KEY,
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        candidate_id text NOT NULL,
        input_hash text NOT NULL,
        verdict text NOT NULL,
        reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
        source_observation_ids jsonb NOT NULL,
        candidate_json jsonb NOT NULL,
        decision_json jsonb NOT NULL,
        evaluated_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (input_hash LIKE 'sha256:%'),
        CHECK (verdict IN ('accepted', 'rejected')),
        UNIQUE (account_id, candidate_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_paper_risk_decisions_journal_idx
      ON helix_paper_risk_decisions
        (owner_profile_id, room_id, evaluated_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_trading_kill_switch_events (
        event_id text PRIMARY KEY,
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        active boolean NOT NULL,
        reason text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  },
};
