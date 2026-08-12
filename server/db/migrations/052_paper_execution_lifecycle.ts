import type { Migration } from "./migration";

export const migration052: Migration = {
  id: "052_paper_execution_lifecycle",
  description:
    "Add sanitized brokerage evidence plus deterministic paper orders, fills, positions, and journal events",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_observation_evidence (
        observation_id text PRIMARY KEY REFERENCES helix_brokerage_read_audit(observation_id) ON DELETE CASCADE,
        normalized_data jsonb NOT NULL,
        output_hash text NOT NULL,
        observed_at timestamptz NOT NULL,
        stored_at timestamptz NOT NULL DEFAULT now(),
        CHECK (output_hash LIKE 'sha256:%')
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_orders (
        order_id text PRIMARY KEY,
        client_order_id text NOT NULL,
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        risk_decision_id text REFERENCES helix_paper_risk_decisions(decision_id) ON DELETE RESTRICT,
        intent text NOT NULL,
        symbol text NOT NULL,
        side text NOT NULL,
        order_type text NOT NULL,
        notional_cents integer NOT NULL,
        quantity_micros bigint NOT NULL,
        limit_price_micros bigint NOT NULL,
        stop_price_micros bigint,
        reserved_cents integer NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'open',
        source_observation_id text NOT NULL REFERENCES helix_brokerage_read_audit(observation_id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        filled_at timestamptz,
        cancelled_at timestamptz,
        CHECK (intent IN ('entry', 'exit')),
        CHECK (side IN ('buy', 'sell')),
        CHECK (order_type = 'limit'),
        CHECK (notional_cents > 0),
        CHECK (quantity_micros > 0),
        CHECK (limit_price_micros > 0),
        CHECK (stop_price_micros IS NULL OR stop_price_micros > 0),
        CHECK (reserved_cents >= 0),
        CHECK (status IN ('open', 'filled', 'cancelled')),
        CHECK (
          (intent = 'entry' AND side = 'buy' AND risk_decision_id IS NOT NULL AND stop_price_micros IS NOT NULL) OR
          (intent = 'exit' AND side = 'sell' AND risk_decision_id IS NULL)
        ),
        UNIQUE (account_id, client_order_id),
        UNIQUE (risk_decision_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_paper_orders_open_idx
      ON helix_paper_orders (account_id, symbol, created_at)
      WHERE status = 'open';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_positions (
        position_id text PRIMARY KEY,
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        symbol text NOT NULL,
        quantity_micros bigint NOT NULL,
        average_entry_price_micros bigint NOT NULL,
        stop_price_micros bigint NOT NULL,
        cost_basis_cents integer NOT NULL,
        last_price_micros bigint NOT NULL,
        market_value_cents integer NOT NULL,
        unrealized_pnl_cents integer NOT NULL,
        entry_order_id text NOT NULL UNIQUE REFERENCES helix_paper_orders(order_id) ON DELETE RESTRICT,
        exit_order_id text UNIQUE REFERENCES helix_paper_orders(order_id) ON DELETE RESTRICT,
        status text NOT NULL DEFAULT 'open',
        opened_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        closed_at timestamptz,
        CHECK (quantity_micros > 0),
        CHECK (average_entry_price_micros > 0),
        CHECK (stop_price_micros > 0),
        CHECK (cost_basis_cents > 0),
        CHECK (last_price_micros > 0),
        CHECK (market_value_cents >= 0),
        CHECK (status IN ('open', 'closed'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_paper_positions_open_idx
      ON helix_paper_positions (account_id, symbol)
      WHERE status = 'open';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_fills (
        fill_id text PRIMARY KEY,
        order_id text NOT NULL UNIQUE REFERENCES helix_paper_orders(order_id) ON DELETE RESTRICT,
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        position_id text REFERENCES helix_paper_positions(position_id) ON DELETE RESTRICT,
        side text NOT NULL,
        symbol text NOT NULL,
        quantity_micros bigint NOT NULL,
        price_micros bigint NOT NULL,
        gross_cents integer NOT NULL,
        source_observation_id text NOT NULL REFERENCES helix_brokerage_read_audit(observation_id) ON DELETE RESTRICT,
        market_observed_at timestamptz NOT NULL,
        filled_at timestamptz NOT NULL,
        CHECK (side IN ('buy', 'sell')),
        CHECK (quantity_micros > 0),
        CHECK (price_micros > 0),
        CHECK (gross_cents > 0)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_journal_events (
        event_id text PRIMARY KEY,
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        subject_ref text NOT NULL,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        CHECK (event_type IN (
          'entry_submitted', 'entry_filled', 'entry_cancelled',
          'position_marked', 'stop_triggered', 'exit_filled'
        ))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_paper_journal_events_account_idx
      ON helix_paper_journal_events (account_id, created_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_paper_processed_observations (
        account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        observation_id text NOT NULL REFERENCES helix_brokerage_read_audit(observation_id) ON DELETE RESTRICT,
        receipt_json jsonb NOT NULL,
        processed_at timestamptz NOT NULL,
        PRIMARY KEY (account_id, observation_id)
      );
    `);
  },
};
