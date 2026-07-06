import type { Migration } from "./migration";

export const migration028: Migration = {
  id: "028_helix_account_recovery",
  description: "Add account recovery attempt tracking and email outbox",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_account_sign_in_attempts (
        email_key text PRIMARY KEY,
        failed_attempt_count integer NOT NULL DEFAULT 0,
        last_failed_at timestamptz,
        last_success_at timestamptz,
        reset_request_count integer NOT NULL DEFAULT 0,
        reset_window_started_at timestamptz,
        reset_limited_until timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_email_outbox (
        email_id text PRIMARY KEY,
        recipient text NOT NULL,
        template text NOT NULL,
        subject text NOT NULL,
        text_body text NOT NULL,
        html_body text,
        provider text NOT NULL,
        status text NOT NULL,
        provider_message_id text,
        error text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        sent_at timestamptz
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_email_outbox_recipient_idx
      ON helix_email_outbox (lower(recipient), created_at DESC);
    `);
  },
};
