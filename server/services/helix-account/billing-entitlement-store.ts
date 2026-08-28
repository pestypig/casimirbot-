import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type {
  HelixBillingEntitlement,
  HelixStripeSandboxEvent,
  HelixStripeWebhookOutcome,
} from "@shared/helix-billing-entitlement";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";

type EntitlementRow = {
  customer_id: string | null;
  subscription_id: string | null;
  plan_id: string | null;
  status: HelixBillingEntitlement["status"];
  hard_account_ceiling_minor: string | number;
  period_starts_at: Date | string | null;
  period_ends_at: Date | string | null;
  last_event_created_at: Date | string | null;
};

type LedgerRow = {
  entry_id: string;
  kind: "included_credit" | "prepaid_credit" | "refund_reversal" | "operator_adjustment";
  amount_minor: string | number;
  reference_entry_id: string | null;
  created_at: Date | string;
};

type LedgerTotalsRow = {
  included_minor: string | number;
  prepaid_minor: string | number;
  adjustments_minor: string | number;
};

export class BillingEntitlementStoreError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "profile_not_found"
      | "invalid_amount"
      | "reference_not_found"
      | "refund_exceeds_reference"
      | "balance_underflow"
      | "ceiling_exceeded"
      | "entitlement_not_active"
      | "plan_not_supported"
      | "portal_customer_unavailable"
      | "currency_not_supported",
    message: string,
  ) {
    super(message);
    this.name = "BillingEntitlementStoreError";
  }
}

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();
const nullableIso = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);
const integer = (value: string | number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("Unsafe billing integer");
  return parsed;
};
const stableRef = (prefix: string, value: string): string =>
  `${prefix}:sha256:${crypto.createHash("sha256").update(value).digest("hex").slice(0, 32)}`;
const semanticKey = (event: HelixStripeSandboxEvent): string => {
  if (event.action === "subscription_updated") {
    return [event.action, event.object_id, event.status ?? "none",
      event.period_ends_at ?? "none"].join(":");
  }
  if (event.action === "refund_posted") {
    return `${event.action}:${event.object_id}:${event.amount_minor}`;
  }
  return `${event.action}:${event.object_id}`;
};

const SANDBOX_PLAN_CEILINGS_MINOR = {
  starter_monthly: 2_500,
} as const;

export class BillingEntitlementStore {
  constructor(private readonly dependencies: Readonly<{
    pool?: Pool;
    now?: () => Date;
    randomId?: () => string;
    persist?: () => Promise<void>;
    sandboxConfigured?: () => boolean;
    checkoutConfigured?: () => boolean;
    portalConfigured?: () => boolean;
  }> = {}) {}

  private async pool(): Promise<Pool> {
    if (this.dependencies.pool) return this.dependencies.pool;
    await ensureDatabase();
    return getPool();
  }

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private randomId(): string {
    return (this.dependencies.randomId ?? crypto.randomUUID)();
  }

  private async balance(client: PoolClient, profileId: string): Promise<number> {
    const { rows } = await client.query<{ balance_minor: string | number }>(
      `SELECT COALESCE(SUM(amount_minor), 0) AS balance_minor
       FROM helix_billing_ledger_entries WHERE profile_id = $1;`,
      [profileId],
    );
    return integer(rows[0]?.balance_minor ?? 0);
  }

  async applyStripeEvent(
    event: HelixStripeSandboxEvent,
  ): Promise<HelixStripeWebhookOutcome> {
    if (event.currency !== "usd") {
      throw new BillingEntitlementStoreError(409, "currency_not_supported", "Only USD sandbox events are admitted.");
    }
    const pool = await this.pool();
    const client = await pool.connect();
    let committed = false;
    try {
      await client.query("BEGIN");
      const profile = await client.query<{ present: boolean }>(
        "SELECT true AS present FROM helix_accounts WHERE profile_id = $1 AND deleted_at IS NULL LIMIT 1;",
        [event.profile_id],
      );
      if (profile.rows[0]?.present !== true) {
        throw new BillingEntitlementStoreError(404, "profile_not_found", "The billing profile does not exist.");
      }
      const duplicate = await client.query<{ processor_event_id: string }>(
        `SELECT processor_event_id FROM helix_billing_webhook_events
         WHERE processor_event_id = $1 OR semantic_key = $2 LIMIT 1;`,
        [event.event_id, semanticKey(event)],
      );
      if (duplicate.rowCount) {
        await client.query("COMMIT");
        committed = true;
        return {
          ok: true,
          outcome: "duplicate",
          event_ref: stableRef("billing_event", duplicate.rows[0].processor_event_id),
          ledger_posted: false,
          live_mode: false,
          raw_processor_object_included: false,
        };
      }
      await client.query(
        `INSERT INTO helix_billing_entitlements (
           profile_id, processor, environment, status, currency,
           hard_account_ceiling_minor, created_at, updated_at
         ) VALUES ($1, 'stripe', 'sandbox', 'sandbox_ready', 'usd', 0, $2, $2)
         ON CONFLICT (profile_id) DO NOTHING;`,
        [event.profile_id, this.now().toISOString()],
      );
      const entitlementResult = await client.query<EntitlementRow>(
        `SELECT customer_id, subscription_id, plan_id, status,
                hard_account_ceiling_minor, period_starts_at,
                period_ends_at, last_event_created_at
         FROM helix_billing_entitlements WHERE profile_id = $1 FOR UPDATE;`,
        [event.profile_id],
      );
      const entitlement = entitlementResult.rows[0];
      const stale = entitlement.last_event_created_at !== null &&
        new Date(event.created_at).getTime() < new Date(entitlement.last_event_created_at).getTime();
      if (stale) {
        await client.query(
          `INSERT INTO helix_billing_webhook_events (
             processor_event_id, profile_id, event_type, object_id, semantic_key,
             event_created_at, payload_sha256, outcome, ledger_posted, processed_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,'ignored',false,$8);`,
          [event.event_id, event.profile_id, event.event_type, event.object_id,
            semanticKey(event), event.created_at, event.payload_sha256, this.now().toISOString()],
        );
        await client.query("COMMIT");
        committed = true;
        return {
          ok: true,
          outcome: "ignored",
          event_ref: stableRef("billing_event", event.event_id),
          ledger_posted: false,
          live_mode: false,
          raw_processor_object_included: false,
        };
      }

      let ledgerKind: LedgerRow["kind"] | null = null;
      let ledgerAmount = 0;
      let referenceEntryId: string | null = null;
      let effectiveCeiling = integer(entitlement.hard_account_ceiling_minor);
      if (event.action === "plan_activated") {
        if (event.plan_id !== "starter_monthly") {
          throw new BillingEntitlementStoreError(409, "plan_not_supported", "The sandbox plan is not supported.");
        }
        if (event.amount_minor <= 0) throw new BillingEntitlementStoreError(409, "invalid_amount", "Included credit must be positive.");
        const planCeiling = SANDBOX_PLAN_CEILINGS_MINOR[event.plan_id];
        effectiveCeiling = effectiveCeiling > 0
          ? Math.min(effectiveCeiling, planCeiling)
          : planCeiling;
        ledgerKind = "included_credit";
        ledgerAmount = event.amount_minor;
      } else if (event.action === "prepaid_credit_purchased") {
        if (event.amount_minor <= 0) throw new BillingEntitlementStoreError(409, "invalid_amount", "Prepaid credit must be positive.");
        if (entitlement.status !== "active") {
          throw new BillingEntitlementStoreError(409, "entitlement_not_active", "Prepaid credit requires an active sandbox plan.");
        }
        ledgerKind = "prepaid_credit";
        ledgerAmount = event.amount_minor;
      } else if (event.action === "refund_posted") {
        if (event.amount_minor <= 0 || !event.reference_object_id) {
          throw new BillingEntitlementStoreError(409, "invalid_amount", "A refund requires a positive amount and original object reference.");
        }
        const reference = await client.query<{
          entry_id: string;
          amount_minor: string | number;
        }>(
          `SELECT entry_id, amount_minor FROM helix_billing_ledger_entries
           WHERE profile_id = $1 AND processor_object_id = $2
             AND kind IN ('included_credit','prepaid_credit') LIMIT 1;`,
          [event.profile_id, event.reference_object_id],
        );
        if (!reference.rowCount) {
          throw new BillingEntitlementStoreError(409, "reference_not_found", "The refunded credit entry was not found.");
        }
        referenceEntryId = reference.rows[0].entry_id;
        const originalAmount = integer(reference.rows[0].amount_minor);
        if (event.amount_minor > originalAmount) {
          throw new BillingEntitlementStoreError(
            409,
            "refund_exceeds_reference",
            "The cumulative refund exceeds the referenced credit entry.",
          );
        }
        const refunded = await client.query<{
          refunded_minor: string | number;
        }>(
          `SELECT COALESCE(-SUM(amount_minor), 0) AS refunded_minor
           FROM helix_billing_ledger_entries
           WHERE profile_id = $1 AND reference_entry_id = $2
             AND kind = 'refund_reversal';`,
          [event.profile_id, referenceEntryId],
        );
        const alreadyRefunded = integer(refunded.rows[0]?.refunded_minor ?? 0);
        if (event.amount_minor <= alreadyRefunded) {
          throw new BillingEntitlementStoreError(
            409,
            "invalid_amount",
            "The cumulative refund did not advance the referenced refund.",
          );
        }
        ledgerKind = "refund_reversal";
        ledgerAmount = -(event.amount_minor - alreadyRefunded);
      }

      const currentBalance = await this.balance(client, event.profile_id);
      if (currentBalance + ledgerAmount < 0) {
        throw new BillingEntitlementStoreError(409, "balance_underflow", "The ledger operation would make available credit negative.");
      }
      if (ledgerAmount > 0 && currentBalance + ledgerAmount > effectiveCeiling) {
        throw new BillingEntitlementStoreError(409, "ceiling_exceeded", "The ledger operation exceeds the hard account ceiling.");
      }

      await client.query(
        `INSERT INTO helix_billing_webhook_events (
           processor_event_id, profile_id, event_type, object_id, semantic_key,
           event_created_at, payload_sha256, outcome, ledger_posted, processed_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'processed',$8,$9);`,
        [event.event_id, event.profile_id, event.event_type, event.object_id,
          semanticKey(event), event.created_at, event.payload_sha256,
          ledgerKind !== null, this.now().toISOString()],
      );
      if (ledgerKind) {
        const ledgerObjectId = event.action === "plan_activated" ||
            event.action === "prepaid_credit_purchased"
          ? event.reference_object_id ?? event.object_id
          : event.object_id;
        await client.query(
          `INSERT INTO helix_billing_ledger_entries (
             entry_id, profile_id, kind, amount_minor, currency,
             processor_event_id, processor_object_id, reference_entry_id,
             idempotency_key, created_at
           ) VALUES ($1,$2,$3,$4,'usd',$5,$6,$7,$8,$9);`,
          [`bill_entry_${this.randomId()}`, event.profile_id, ledgerKind,
            ledgerAmount, event.event_id, ledgerObjectId, referenceEntryId,
            `stripe:${semanticKey(event)}`, this.now().toISOString()],
        );
      }
      const nextStatus = event.action === "payment_failed"
        ? "past_due"
        : event.action === "subscription_canceled"
          ? "canceled"
          : event.status ?? (event.action === "plan_activated" ? "active" : entitlement.status);
      await client.query(
        `UPDATE helix_billing_entitlements SET
           customer_id = COALESCE($2, customer_id),
           subscription_id = COALESCE($3, subscription_id),
           plan_id = COALESCE($4, plan_id), status = $5,
           hard_account_ceiling_minor = $6,
           period_starts_at = COALESCE($7, period_starts_at),
           period_ends_at = COALESCE($8, period_ends_at),
           last_event_created_at = $9, updated_at = $10
         WHERE profile_id = $1;`,
        [event.profile_id, event.customer_id, event.subscription_id,
          event.plan_id, nextStatus, effectiveCeiling, event.period_starts_at,
          event.period_ends_at, event.created_at, this.now().toISOString()],
      );
      await client.query("COMMIT");
      committed = true;
      await (this.dependencies.persist ?? persistLocalDatabaseSnapshotIfEnabled)();
      return {
        ok: true,
        outcome: "processed",
        event_ref: stableRef("billing_event", event.event_id),
        ledger_posted: ledgerKind !== null,
        live_mode: false,
        raw_processor_object_included: false,
      };
    } catch (error) {
      if (!committed) await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async applyOperatorAdjustment(input: {
    profileId: string;
    amountMinor: number;
    idempotencyKey: string;
    referenceObjectId: string;
  }): Promise<"processed" | "duplicate"> {
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor === 0) {
      throw new BillingEntitlementStoreError(409, "invalid_amount", "An adjustment must be a nonzero integer minor-unit amount.");
    }
    if (!/^[A-Za-z0-9:_-]{8,160}$/u.test(input.idempotencyKey)) {
      throw new BillingEntitlementStoreError(409, "invalid_amount", "The adjustment idempotency key is invalid.");
    }
    const client = await (await this.pool()).connect();
    let committed = false;
    try {
      await client.query("BEGIN");
      const duplicate = await client.query(
        "SELECT 1 FROM helix_billing_ledger_entries WHERE idempotency_key = $1 LIMIT 1;",
        [`operator:${input.idempotencyKey}`],
      );
      if (duplicate.rowCount) {
        await client.query("COMMIT");
        committed = true;
        return "duplicate";
      }
      const entitlement = await client.query<EntitlementRow>(
        `SELECT plan_id, status, hard_account_ceiling_minor, period_starts_at,
                period_ends_at, last_event_created_at
         FROM helix_billing_entitlements WHERE profile_id = $1 FOR UPDATE;`,
        [input.profileId],
      );
      if (!entitlement.rowCount) {
        throw new BillingEntitlementStoreError(404, "profile_not_found", "The billing profile does not exist.");
      }
      const reference = await client.query<{ entry_id: string }>(
        `SELECT entry_id FROM helix_billing_ledger_entries
         WHERE profile_id = $1 AND processor_object_id = $2 LIMIT 1;`,
        [input.profileId, input.referenceObjectId],
      );
      if (!reference.rowCount) {
        throw new BillingEntitlementStoreError(409, "reference_not_found", "The adjusted ledger entry was not found.");
      }
      const current = await this.balance(client, input.profileId);
      const next = current + input.amountMinor;
      if (next < 0) {
        throw new BillingEntitlementStoreError(409, "balance_underflow", "The adjustment would make available credit negative.");
      }
      const ceiling = integer(entitlement.rows[0].hard_account_ceiling_minor);
      if (input.amountMinor > 0 && next > ceiling) {
        throw new BillingEntitlementStoreError(409, "ceiling_exceeded", "The adjustment exceeds the hard account ceiling.");
      }
      await client.query(
        `INSERT INTO helix_billing_ledger_entries (
           entry_id, profile_id, kind, amount_minor, currency,
           reference_entry_id, idempotency_key, created_at
         ) VALUES ($1,$2,'operator_adjustment',$3,'usd',$4,$5,$6);`,
        [`bill_entry_${this.randomId()}`, input.profileId, input.amountMinor,
          reference.rows[0].entry_id, `operator:${input.idempotencyKey}`,
          this.now().toISOString()],
      );
      await client.query("COMMIT");
      committed = true;
      await (this.dependencies.persist ?? persistLocalDatabaseSnapshotIfEnabled)();
      return "processed";
    } catch (error) {
      if (!committed) await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async portalCustomerId(profileId: string): Promise<string> {
    const { rows } = await (await this.pool()).query<{
      customer_id: string | null;
    }>(
      `SELECT customer_id FROM helix_billing_entitlements
       WHERE profile_id = $1 LIMIT 1;`,
      [profileId],
    );
    const customerId = rows[0]?.customer_id ?? null;
    if (!customerId || !/^cus_[A-Za-z0-9]+$/u.test(customerId)) {
      throw new BillingEntitlementStoreError(
        409,
        "portal_customer_unavailable",
        "No Stripe sandbox customer is available for subscription management.",
      );
    }
    return customerId;
  }

  async status(profileId: string): Promise<HelixBillingEntitlement> {
    const pool = await this.pool();
    const [entitlementResult, ledgerResult, totalsResult] = await Promise.all([
      pool.query<EntitlementRow>(
        `SELECT customer_id, subscription_id, plan_id, status,
                hard_account_ceiling_minor, period_starts_at,
                period_ends_at, last_event_created_at
         FROM helix_billing_entitlements WHERE profile_id = $1 LIMIT 1;`,
        [profileId],
      ),
      pool.query<LedgerRow>(
        `SELECT entry_id, kind, amount_minor, reference_entry_id, created_at
         FROM helix_billing_ledger_entries WHERE profile_id = $1
         ORDER BY created_at DESC, entry_id DESC LIMIT 25;`,
        [profileId],
      ),
      pool.query<LedgerTotalsRow>(
        `SELECT
           COALESCE(SUM(CASE WHEN kind = 'included_credit' THEN amount_minor ELSE 0 END), 0) AS included_minor,
           COALESCE(SUM(CASE WHEN kind = 'prepaid_credit' THEN amount_minor ELSE 0 END), 0) AS prepaid_minor,
           COALESCE(SUM(CASE WHEN kind IN ('refund_reversal','operator_adjustment') THEN amount_minor ELSE 0 END), 0) AS adjustments_minor
         FROM helix_billing_ledger_entries WHERE profile_id = $1;`,
        [profileId],
      ),
    ]);
    const entitlement = entitlementResult.rows[0];
    const totals = totalsResult.rows[0];
    const included = integer(totals?.included_minor ?? 0);
    const prepaid = integer(totals?.prepaid_minor ?? 0);
    const adjustments = integer(totals?.adjustments_minor ?? 0);
    const available = included + prepaid + adjustments;
    if (available < 0) throw new Error("Billing ledger invariant violated: negative balance");
    const sandboxConfigured = this.dependencies.sandboxConfigured?.() ?? false;
    const checkoutConfigured = this.dependencies.checkoutConfigured?.() ?? false;
    const portalConfigured = this.dependencies.portalConfigured?.() ?? false;
    const portalAvailable = portalConfigured &&
      /^cus_[A-Za-z0-9]+$/u.test(entitlement?.customer_id ?? "");
    return {
      schema: "helix.billing_entitlement.v1",
      ok: true,
      generated_at: this.now().toISOString(),
      profile_ref: profileId,
      processor: "stripe",
      environment: "sandbox",
      status: entitlement?.status ?? (sandboxConfigured ? "sandbox_ready" : "sandbox_not_configured"),
      plan_id: entitlement?.plan_id ?? null,
      currency: "usd",
      balance: {
        included_credit_minor: included,
        prepaid_credit_minor: prepaid,
        adjustments_minor: adjustments,
        available_credit_minor: available,
        hard_account_ceiling_minor: entitlement ? integer(entitlement.hard_account_ceiling_minor) : 0,
      },
      period: {
        starts_at: nullableIso(entitlement?.period_starts_at ?? null),
        ends_at: nullableIso(entitlement?.period_ends_at ?? null),
      },
      recent_ledger: ledgerResult.rows.map((row) => ({
        entry_ref: stableRef("billing_entry", row.entry_id),
        kind: row.kind,
        amount_minor: integer(row.amount_minor),
        currency: "usd" as const,
        created_at: iso(row.created_at),
        reference_entry_ref: row.reference_entry_id
          ? stableRef("billing_entry", row.reference_entry_id)
          : null,
      })),
      checkout: {
        hosted_only: true,
        available: sandboxConfigured && checkoutConfigured,
        payment_fields_present: false,
      },
      portal: {
        hosted_only: true,
        available: portalAvailable,
        customer_reference_included: false,
      },
      authority: {
        owner_may_start_checkout: sandboxConfigured && checkoutConfigured,
        owner_may_manage_subscription: portalAvailable,
        agent_may_inspect: true,
        agent_may_purchase: false,
        agent_may_refund: false,
        agent_may_adjust: false,
        agent_may_raise_ceiling: false,
        provider_traffic_enabled: false,
        billable_lease_enabled: false,
      },
      stripe_customer_included: false,
      stripe_subscription_included: false,
      payment_instrument_included: false,
      webhook_secret_included: false,
      raw_processor_object_included: false,
    };
  }
}

export const billingEntitlementStore = new BillingEntitlementStore({
  sandboxConfigured: () =>
    (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false) &&
    (process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ?? false),
  checkoutConfigured: () => {
    try {
      const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
      const plan = process.env.STRIPE_SANDBOX_PLAN_PRICE_ID?.trim() ?? "";
      const prepaid = process.env.STRIPE_SANDBOX_PREPAID_PRICE_ID?.trim() ?? "";
      const success = new URL(process.env.STRIPE_SANDBOX_SUCCESS_URL ?? "");
      const cancel = new URL(process.env.STRIPE_SANDBOX_CANCEL_URL ?? "");
      const portal = new URL(process.env.STRIPE_SANDBOX_PORTAL_RETURN_URL ?? "");
      return key.startsWith("sk_test_") && plan.startsWith("price_") &&
        prepaid.startsWith("price_") && success.protocol === "https:" &&
        cancel.protocol === "https:" && portal.protocol === "https:";
    } catch {
      return false;
    }
  },
  portalConfigured: () => {
    try {
      const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
      const portal = new URL(process.env.STRIPE_SANDBOX_PORTAL_RETURN_URL ?? "");
      return key.startsWith("sk_test_") && portal.protocol === "https:";
    } catch {
      return false;
    }
  },
});
