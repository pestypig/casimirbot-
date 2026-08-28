import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migration026 } from "../../../db/migrations/026_helix_accounts";
import { migration073 } from "../../../db/migrations/073_billing_entitlement_ledger";
import type { HelixStripeSandboxEvent } from
  "@shared/helix-billing-entitlement";
import { BillingEntitlementStore } from "../billing-entitlement-store";

const PROFILE = "profile-billing-owner";
const NOW = new Date("2026-08-28T12:00:00.000Z");
const hash = "a".repeat(64);

const event = (
  overrides: Partial<HelixStripeSandboxEvent> = {},
): HelixStripeSandboxEvent => ({
  event_id: "evt_plan_1",
  event_type: "checkout.session.completed",
  object_id: "cs_plan_1",
  created_at: "2026-08-28T11:00:00.000Z",
  profile_id: PROFILE,
  action: "plan_activated",
  plan_id: "starter_monthly",
  amount_minor: 1000,
  currency: "usd",
  status: "active",
  period_starts_at: "2026-08-28T11:00:00.000Z",
  period_ends_at: "2026-09-28T11:00:00.000Z",
  customer_id: "cus_owner1",
  subscription_id: "sub_owner1",
  reference_object_id: null,
  payload_sha256: hash,
  ...overrides,
});

describe("BillingEntitlementStore", () => {
  let pool: Pool;
  let store: BillingEntitlementStore;
  let sequence: number;

  beforeEach(async () => {
    const memory = newDb({ autoCreateForeignKeyIndices: true });
    const pg = memory.adapters.createPg();
    pool = new pg.Pool() as unknown as Pool;
    const client = await pool.connect();
    try {
      await migration026.run(client, { enablePgvector: false });
      await migration073.run(client, { enablePgvector: false });
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO helix_accounts(
         profile_id, display_name, account_type, provider, created_at, updated_at
       ) VALUES ($1, 'Billing Owner', 'developer', 'local', $2, $2);`,
      [PROFILE, NOW.toISOString()],
    );
    sequence = 0;
    store = new BillingEntitlementStore({
      pool,
      now: () => NOW,
      randomId: () => `billing-${++sequence}`,
      persist: vi.fn().mockResolvedValue(undefined),
      sandboxConfigured: () => true,
      portalConfigured: () => true,
    });
  });

  it("posts one plan credit and rejects event and semantic duplicates", async () => {
    expect((await store.applyStripeEvent(event())).outcome).toBe("processed");
    expect((await store.applyStripeEvent(event())).outcome).toBe("duplicate");
    expect((await store.applyStripeEvent(event({ event_id: "evt_plan_retry" }))).outcome)
      .toBe("duplicate");
    const status = await store.status(PROFILE);
    expect(status).toMatchObject({
      status: "active",
      plan_id: "starter_monthly",
      balance: {
        included_credit_minor: 1000,
        available_credit_minor: 1000,
        hard_account_ceiling_minor: 2500,
      },
      portal: { hosted_only: true, available: true },
      authority: { owner_may_manage_subscription: true },
    });
    expect(await store.portalCustomerId(PROFILE)).toBe("cus_owner1");
    expect(JSON.stringify(status)).not.toContain("cus_owner1");
    expect(JSON.stringify(status)).not.toContain("sub_owner1");
    expect(status.recent_ledger).toHaveLength(1);
  });

  it("posts prepaid credit and a reference-bound refund without exposing processor IDs", async () => {
    await store.applyStripeEvent(event());
    await store.applyStripeEvent(event({
      event_id: "evt_topup_1",
      object_id: "cs_topup_1",
      action: "prepaid_credit_purchased",
      plan_id: null,
      amount_minor: 500,
      status: null,
      created_at: "2026-08-28T11:10:00.000Z",
    }));
    await store.applyStripeEvent(event({
      event_id: "evt_refund_1",
      event_type: "charge.refunded",
      object_id: "ch_refund_1",
      action: "refund_posted",
      plan_id: null,
      amount_minor: 200,
      status: null,
      reference_object_id: "cs_topup_1",
      created_at: "2026-08-28T11:20:00.000Z",
    }));
    await store.applyStripeEvent(event({
      event_id: "evt_refund_2",
      event_type: "charge.refunded",
      object_id: "ch_refund_1",
      action: "refund_posted",
      plan_id: null,
      amount_minor: 500,
      status: null,
      customer_id: "cus_owner1",
      subscription_id: null,
      reference_object_id: "cs_topup_1",
      created_at: "2026-08-28T11:25:00.000Z",
    }));
    const status = await store.status(PROFILE);
    expect(status.balance).toMatchObject({
      included_credit_minor: 1000,
      prepaid_credit_minor: 500,
      adjustments_minor: -500,
      available_credit_minor: 1000,
    });
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("cs_topup_1");
    expect(serialized).not.toContain("ch_refund_1");
    await expect(store.applyStripeEvent(event({
      event_id: "evt_refund_exceeds_purchase",
      event_type: "charge.refunded",
      object_id: "ch_refund_1",
      action: "refund_posted",
      plan_id: null,
      amount_minor: 501,
      status: null,
      customer_id: "cus_owner1",
      subscription_id: null,
      reference_object_id: "cs_topup_1",
      created_at: "2026-08-28T11:26:00.000Z",
    }))).rejects.toMatchObject({ code: "refund_exceeds_reference" });
  });

  it("rolls back a refund that would make available credit negative", async () => {
    await store.applyStripeEvent(event());
    await store.applyOperatorAdjustment({
      profileId: PROFILE,
      amountMinor: -900,
      idempotencyKey: "support:pre-refund-debit",
      referenceObjectId: "cs_plan_1",
    });
    await expect(store.applyStripeEvent(event({
      event_id: "evt_refund_too_large",
      event_type: "charge.refunded",
      object_id: "ch_too_large",
      action: "refund_posted",
      amount_minor: 500,
      reference_object_id: "cs_plan_1",
      created_at: "2026-08-28T11:30:00.000Z",
    }))).rejects.toMatchObject({ code: "balance_underflow" });
    expect((await store.status(PROFILE)).balance.available_credit_minor).toBe(100);
    const result = await pool.query(
      "SELECT 1 FROM helix_billing_webhook_events WHERE processor_event_id = 'evt_refund_too_large';",
    );
    expect(result.rowCount).toBe(0);
  });

  it("ignores stale state events and records payment failure deterministically", async () => {
    await store.applyStripeEvent(event());
    const stale = await store.applyStripeEvent(event({
      event_id: "evt_stale_cancel",
      event_type: "customer.subscription.deleted",
      object_id: "sub_stale",
      action: "subscription_canceled",
      amount_minor: 0,
      status: "canceled",
      created_at: "2026-08-28T10:00:00.000Z",
    }));
    expect(stale.outcome).toBe("ignored");
    expect((await store.status(PROFILE)).status).toBe("active");
    await store.applyStripeEvent(event({
      event_id: "evt_failed_1",
      event_type: "invoice.payment_failed",
      object_id: "in_failed_1",
      action: "payment_failed",
      amount_minor: 0,
      status: "past_due",
      created_at: "2026-08-28T11:40:00.000Z",
    }));
    expect((await store.status(PROFILE)).status).toBe("past_due");
  });

  it("admits distinct ordered updates for the same subscription object", async () => {
    await store.applyStripeEvent(event());
    await store.applyStripeEvent(event({
      event_id: "evt_subscription_past_due",
      event_type: "customer.subscription.updated",
      object_id: "sub_owner1",
      action: "subscription_updated",
      amount_minor: 0,
      status: "past_due",
      period_ends_at: "2026-09-28T11:00:00.000Z",
      created_at: "2026-08-28T11:30:00.000Z",
    }));
    await store.applyStripeEvent(event({
      event_id: "evt_subscription_recovered",
      event_type: "customer.subscription.updated",
      object_id: "sub_owner1",
      action: "subscription_updated",
      amount_minor: 0,
      status: "active",
      period_starts_at: "2026-09-28T11:00:00.000Z",
      period_ends_at: "2026-10-28T11:00:00.000Z",
      created_at: "2026-08-28T11:40:00.000Z",
    }));
    const status = await store.status(PROFILE);
    expect(status.status).toBe("active");
    expect(status.period.ends_at).toBe("2026-10-28T11:00:00.000Z");
  });

  it("enforces the independent hard account ceiling", async () => {
    await pool.query(
      `INSERT INTO helix_billing_entitlements(
         profile_id, status, hard_account_ceiling_minor
       ) VALUES ($1, 'sandbox_ready', 900);`,
      [PROFILE],
    );
    await expect(store.applyStripeEvent(event())).rejects.toMatchObject({
      code: "ceiling_exceeded",
    });
    expect((await store.status(PROFILE)).balance.available_credit_minor).toBe(0);
  });

  it("treats a zero ceiling as locked and rejects prepaid credit before plan activation", async () => {
    await expect(store.applyStripeEvent(event({
      event_id: "evt_topup_before_plan",
      object_id: "cs_topup_before_plan",
      action: "prepaid_credit_purchased",
      plan_id: null,
      amount_minor: 500,
      status: null,
      reference_object_id: "pi_topup_before_plan",
    }))).rejects.toMatchObject({ code: "entitlement_not_active" });
    const status = await store.status(PROFILE);
    expect(status.balance).toMatchObject({
      available_credit_minor: 0,
      hard_account_ceiling_minor: 0,
    });
  });

  it("rejects a positive adjustment when no finite ceiling has been established", async () => {
    await pool.query(
      `INSERT INTO helix_billing_entitlements(
         profile_id, status, hard_account_ceiling_minor
       ) VALUES ($1, 'sandbox_ready', 0);`,
      [PROFILE],
    );
    await pool.query(
      `INSERT INTO helix_billing_ledger_entries(
         entry_id, profile_id, kind, amount_minor, currency,
         processor_object_id, idempotency_key, created_at
       ) VALUES ('bill_entry_seed', $1, 'included_credit', 1, 'usd',
         'support_seed', 'operator:seed-entry', $2);`,
      [PROFILE, NOW.toISOString()],
    );
    await expect(store.applyOperatorAdjustment({
      profileId: PROFILE,
      amountMinor: 1,
      idempotencyKey: "support:locked-ceiling",
      referenceObjectId: "support_seed",
    })).rejects.toMatchObject({ code: "ceiling_exceeded" });
  });

  it("posts a reference-bound operator adjustment exactly once", async () => {
    await store.applyStripeEvent(event());
    expect(await store.applyOperatorAdjustment({
      profileId: PROFILE,
      amountMinor: -100,
      idempotencyKey: "support:case-123",
      referenceObjectId: "cs_plan_1",
    })).toBe("processed");
    expect(await store.applyOperatorAdjustment({
      profileId: PROFILE,
      amountMinor: -100,
      idempotencyKey: "support:case-123",
      referenceObjectId: "cs_plan_1",
    })).toBe("duplicate");
    const status = await store.status(PROFILE);
    expect(status.balance).toMatchObject({
      adjustments_minor: -100,
      available_credit_minor: 900,
    });
    expect(status.recent_ledger[0]).toMatchObject({
      kind: "operator_adjustment",
      amount_minor: -100,
      reference_entry_ref: expect.stringMatching(/^billing_entry:sha256:/),
    });
  });

  it("rejects crossed or unknown profile identity", async () => {
    await expect(store.applyStripeEvent(event({ profile_id: "profile-other" })))
      .rejects.toMatchObject({ code: "profile_not_found" });
  });
});
