import type { Migration } from "./migration";

export const migration073: Migration = {
  id: "073_billing_entitlement_ledger",
  description: "Add Stripe-sandbox entitlement and immutable credit ledger",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_billing_entitlements (
        profile_id text PRIMARY KEY REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        processor text NOT NULL DEFAULT 'stripe',
        environment text NOT NULL DEFAULT 'sandbox',
        customer_id text,
        subscription_id text,
        plan_id text,
        status text NOT NULL DEFAULT 'sandbox_not_configured',
        currency text NOT NULL DEFAULT 'usd',
        hard_account_ceiling_minor bigint NOT NULL DEFAULT 0,
        period_starts_at timestamptz,
        period_ends_at timestamptz,
        last_event_created_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (processor = 'stripe'),
        CHECK (environment = 'sandbox'),
        CHECK (status IN ('sandbox_not_configured', 'sandbox_ready', 'active', 'past_due', 'canceled')),
        CHECK (currency = 'usd'),
        CHECK (hard_account_ceiling_minor >= 0)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_billing_webhook_events (
        processor_event_id text PRIMARY KEY,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        object_id text NOT NULL,
        semantic_key text NOT NULL UNIQUE,
        event_created_at timestamptz NOT NULL,
        payload_sha256 char(64) NOT NULL,
        outcome text NOT NULL,
        ledger_posted boolean NOT NULL DEFAULT false,
        processed_at timestamptz NOT NULL DEFAULT now(),
        CHECK (outcome IN ('processed', 'ignored'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_billing_ledger_entries (
        entry_id text PRIMARY KEY,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        kind text NOT NULL,
        amount_minor bigint NOT NULL,
        currency text NOT NULL DEFAULT 'usd',
        processor_event_id text REFERENCES helix_billing_webhook_events(processor_event_id),
        processor_object_id text,
        reference_entry_id text REFERENCES helix_billing_ledger_entries(entry_id),
        idempotency_key text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (kind IN ('included_credit', 'prepaid_credit', 'refund_reversal', 'operator_adjustment')),
        CHECK (amount_minor <> 0),
        CHECK (currency = 'usd')
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_billing_ledger_profile_created_idx
      ON helix_billing_ledger_entries (profile_id, created_at DESC);
    `);
  },
};
