import { z } from "zod";

export const HELIX_BILLING_ENTITLEMENT_SCHEMA =
  "helix.billing_entitlement.v1" as const;

export const helixBillingStateSchema = z.enum([
  "sandbox_not_configured",
  "sandbox_ready",
  "active",
  "past_due",
  "canceled",
]);

export const helixBillingLedgerKindSchema = z.enum([
  "included_credit",
  "prepaid_credit",
  "refund_reversal",
  "operator_adjustment",
]);

export const helixBillingLedgerEntrySchema = z.object({
  entry_ref: z.string().min(1).max(96),
  kind: helixBillingLedgerKindSchema,
  amount_minor: z.number().int(),
  currency: z.literal("usd"),
  created_at: z.string().datetime(),
  reference_entry_ref: z.string().min(1).max(96).nullable(),
}).strict();

export const helixBillingEntitlementSchema = z.object({
  schema: z.literal(HELIX_BILLING_ENTITLEMENT_SCHEMA),
  ok: z.literal(true),
  generated_at: z.string().datetime(),
  profile_ref: z.string().min(1).max(240),
  processor: z.literal("stripe"),
  environment: z.literal("sandbox"),
  status: helixBillingStateSchema,
  plan_id: z.string().min(1).max(80).nullable(),
  currency: z.literal("usd"),
  balance: z.object({
    included_credit_minor: z.number().int().nonnegative(),
    prepaid_credit_minor: z.number().int().nonnegative(),
    adjustments_minor: z.number().int(),
    available_credit_minor: z.number().int().nonnegative(),
    hard_account_ceiling_minor: z.number().int().nonnegative(),
  }).strict(),
  period: z.object({
    starts_at: z.string().datetime().nullable(),
    ends_at: z.string().datetime().nullable(),
  }).strict(),
  recent_ledger: z.array(helixBillingLedgerEntrySchema).max(25),
  checkout: z.object({
    hosted_only: z.literal(true),
    available: z.boolean(),
    payment_fields_present: z.literal(false),
  }).strict(),
  portal: z.object({
    hosted_only: z.literal(true),
    available: z.boolean(),
    customer_reference_included: z.literal(false),
  }).strict(),
  authority: z.object({
    owner_may_start_checkout: z.boolean(),
    owner_may_manage_subscription: z.boolean(),
    agent_may_inspect: z.literal(true),
    agent_may_purchase: z.literal(false),
    agent_may_refund: z.literal(false),
    agent_may_adjust: z.literal(false),
    agent_may_raise_ceiling: z.literal(false),
    provider_traffic_enabled: z.literal(false),
    billable_lease_enabled: z.literal(false),
  }).strict(),
  stripe_customer_included: z.literal(false),
  stripe_subscription_included: z.literal(false),
  payment_instrument_included: z.literal(false),
  webhook_secret_included: z.literal(false),
  raw_processor_object_included: z.literal(false),
}).strict();

export type HelixBillingEntitlement = z.infer<
  typeof helixBillingEntitlementSchema
>;
export type HelixBillingLedgerKind = z.infer<
  typeof helixBillingLedgerKindSchema
>;

export const helixStripeSandboxEventSchema = z.object({
  event_id: z.string().regex(/^evt_[A-Za-z0-9_]+$/u).max(255),
  event_type: z.enum([
    "checkout.session.completed",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "charge.refunded",
  ]),
  object_id: z.string().min(3).max(255),
  created_at: z.string().datetime(),
  profile_id: z.string().min(1).max(240),
  action: z.enum([
    "plan_activated",
    "prepaid_credit_purchased",
    "payment_failed",
    "subscription_updated",
    "subscription_canceled",
    "refund_posted",
  ]),
  plan_id: z.string().min(1).max(80).nullable(),
  amount_minor: z.number().int().nonnegative(),
  currency: z.literal("usd"),
  status: z.enum(["active", "past_due", "canceled"]).nullable(),
  period_starts_at: z.string().datetime().nullable(),
  period_ends_at: z.string().datetime().nullable(),
  customer_id: z.string().regex(/^cus_[A-Za-z0-9]+$/u).max(255).nullable(),
  subscription_id: z.string().regex(/^sub_[A-Za-z0-9]+$/u).max(255).nullable(),
  reference_object_id: z.string().min(3).max(255).nullable(),
  payload_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict();

export type HelixStripeSandboxEvent = z.infer<
  typeof helixStripeSandboxEventSchema
>;

export const helixStripeWebhookOutcomeSchema = z.object({
  ok: z.literal(true),
  outcome: z.enum(["processed", "duplicate", "ignored"]),
  event_ref: z.string().min(1).max(96),
  ledger_posted: z.boolean(),
  live_mode: z.literal(false),
  raw_processor_object_included: z.literal(false),
}).strict();

export type HelixStripeWebhookOutcome = z.infer<
  typeof helixStripeWebhookOutcomeSchema
>;

export const HELIX_BILLING_CHECKOUT_TARGETS = [
  "billing_checkout:plan:starter_monthly",
  "billing_checkout:prepaid:500",
] as const;
export const HELIX_BILLING_PORTAL_TARGET =
  "billing_portal:manage_subscription" as const;
export const HELIX_BILLING_CHECKOUT_OPERATION_PATH =
  "/api/account/billing/checkout" as const;
export const HELIX_BILLING_PORTAL_OPERATION_PATH =
  "/api/account/billing/portal" as const;
export const helixBillingCheckoutTargetSchema = z.enum(
  HELIX_BILLING_CHECKOUT_TARGETS,
);
export const helixBillingPortalTargetSchema = z.literal(
  HELIX_BILLING_PORTAL_TARGET,
);
export const helixBillingPaymentTargetSchema = z.union([
  helixBillingCheckoutTargetSchema,
  helixBillingPortalTargetSchema,
]);
export type HelixBillingCheckoutTarget = z.infer<
  typeof helixBillingCheckoutTargetSchema
>;

export const helixBillingCheckoutOperationSchema = z.object({
  schema: z.literal("helix.billing_checkout_operation.v1"),
  ok: z.literal(true),
  operation: z.literal("payment_change"),
  receipt_ref: z.string().min(1).max(96),
  hosted_url: z.string().url().max(2_048).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "checkout.stripe.com" &&
        !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Expected an exact Stripe Checkout URL"),
  target_ref: helixBillingCheckoutTargetSchema,
  operation_applied: z.literal(true),
  payment_instrument_included: z.literal(false),
  stripe_secret_included: z.literal(false),
  raw_processor_object_included: z.literal(false),
}).strict();

export const helixBillingPortalOperationSchema = z.object({
  schema: z.literal("helix.billing_portal_operation.v1"),
  ok: z.literal(true),
  operation: z.literal("payment_change"),
  receipt_ref: z.string().min(1).max(96),
  hosted_url: z.string().url().max(2_048).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "billing.stripe.com" &&
        !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Expected an exact Stripe Billing Portal URL"),
  target_ref: helixBillingPortalTargetSchema,
  operation_applied: z.literal(true),
  customer_reference_included: z.literal(false),
  payment_instrument_included: z.literal(false),
  stripe_secret_included: z.literal(false),
  raw_processor_object_included: z.literal(false),
}).strict();
