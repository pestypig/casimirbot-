import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import {
  helixStripeSandboxEventSchema,
  type HelixStripeSandboxEvent,
} from "@shared/helix-billing-entitlement";
import {
  BillingEntitlementStore,
  BillingEntitlementStoreError,
  billingEntitlementStore,
} from "../services/helix-account/billing-entitlement-store";

type StripeObject = Record<string, unknown>;

const record = (value: unknown): StripeObject | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as StripeObject
    : null;
const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const integer = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) ? value : null;
const epochIso = (value: unknown): string | null => {
  const seconds = integer(value) ?? (
    typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : null
  );
  if (seconds === null || seconds < 0) return null;
  return new Date(seconds * 1000).toISOString();
};

export const verifyStripeWebhookSignature = (input: {
  rawBody: Buffer;
  signatureHeader: string;
  secret: string;
  nowMs: number;
  toleranceSeconds?: number;
}): boolean => {
  if (!input.secret.startsWith("whsec_")) return false;
  const parts = input.signatureHeader.split(",").map((part) => part.trim());
  const timestampText = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter((value) => /^[a-f0-9]{64}$/u.test(value));
  const timestamp = timestampText && /^\d+$/u.test(timestampText)
    ? Number(timestampText)
    : Number.NaN;
  if (!Number.isSafeInteger(timestamp) || signatures.length === 0) return false;
  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(Math.floor(input.nowMs / 1000) - timestamp) > tolerance) return false;
  const expected = crypto.createHmac("sha256", input.secret)
    .update(`${timestamp}.`)
    .update(input.rawBody)
    .digest();
  return signatures.some((candidate) => {
    const actual = Buffer.from(candidate, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
};

const normalizeStripeEvent = (rawBody: Buffer): HelixStripeSandboxEvent | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return null;
  }
  const event = record(parsed);
  const data = record(event?.data);
  const object = record(data?.object);
  if (!event || !object || event.livemode !== false) return null;
  const eventId = text(event.id);
  const eventType = text(event.type);
  const objectId = text(object.id);
  const createdAt = epochIso(event.created);
  const subscriptionDetails = record(object.subscription_details) ??
    record(record(object.parent)?.subscription_details);
  const metadata = record(object.metadata) ??
    record(subscriptionDetails?.metadata) ?? {};
  const profileId = text(metadata.casimir_profile_id);
  const currency = text(object.currency)?.toLowerCase() ?? "usd";
  if (!eventId || !eventType || !objectId || !createdAt || !profileId) return null;

  let candidate: Omit<HelixStripeSandboxEvent, "payload_sha256"> | null = null;
  if (eventType === "checkout.session.completed") {
    if (object.payment_status !== "paid") return null;
    const kind = text(metadata.casimir_purchase_kind);
    const amount = kind === "plan"
      ? Number(text(metadata.casimir_included_credit_minor))
      : integer(object.amount_total);
    if (!Number.isSafeInteger(amount) || amount < 0) return null;
    candidate = {
      event_id: eventId,
      event_type: eventType,
      object_id: objectId,
      created_at: createdAt,
      profile_id: profileId,
      action: kind === "plan" ? "plan_activated" : "prepaid_credit_purchased",
      plan_id: text(metadata.casimir_plan_id),
      amount_minor: amount,
      currency,
      status: kind === "plan" ? "active" : null,
      period_starts_at: epochIso(metadata.casimir_period_starts_at),
      period_ends_at: epochIso(metadata.casimir_period_ends_at),
      customer_id: text(object.customer),
      subscription_id: kind === "plan" ? text(object.subscription) : null,
      reference_object_id: kind === "plan" ? null : text(object.payment_intent),
    };
  } else if (eventType === "invoice.payment_failed") {
    candidate = {
      event_id: eventId, event_type: eventType, object_id: objectId,
      created_at: createdAt, profile_id: profileId, action: "payment_failed",
      plan_id: text(metadata.casimir_plan_id), amount_minor: 0, currency,
      status: "past_due", period_starts_at: null, period_ends_at: null,
      customer_id: text(object.customer),
      subscription_id: text(object.subscription) ?? text(subscriptionDetails?.subscription),
      reference_object_id: null,
    };
  } else if (eventType === "customer.subscription.updated") {
    const status = object.status === "active"
      ? "active"
      : object.status === "past_due"
        ? "past_due"
        : object.status === "canceled"
          ? "canceled"
          : null;
    if (!status) return null;
    candidate = {
      event_id: eventId, event_type: eventType, object_id: objectId,
      created_at: createdAt, profile_id: profileId, action: "subscription_updated",
      plan_id: text(metadata.casimir_plan_id), amount_minor: 0, currency,
      status, period_starts_at: epochIso(object.current_period_start),
      period_ends_at: epochIso(object.current_period_end),
      customer_id: text(object.customer), subscription_id: objectId,
      reference_object_id: null,
    };
  } else if (eventType === "customer.subscription.deleted") {
    candidate = {
      event_id: eventId, event_type: eventType, object_id: objectId,
      created_at: createdAt, profile_id: profileId, action: "subscription_canceled",
      plan_id: text(metadata.casimir_plan_id), amount_minor: 0, currency,
      status: "canceled", period_starts_at: null,
      period_ends_at: epochIso(object.current_period_end),
      customer_id: text(object.customer), subscription_id: objectId,
      reference_object_id: null,
    };
  } else if (eventType === "charge.refunded") {
    const amount = integer(object.amount_refunded);
    const reference = text(object.payment_intent) ??
      text(metadata.casimir_credit_object_id);
    if (amount === null || amount <= 0 || !reference) return null;
    candidate = {
      event_id: eventId, event_type: eventType, object_id: objectId,
      created_at: createdAt, profile_id: profileId, action: "refund_posted",
      plan_id: null, amount_minor: amount, currency, status: null,
      period_starts_at: null, period_ends_at: null,
      customer_id: text(object.customer), subscription_id: null,
      reference_object_id: reference,
    };
  } else {
    return null;
  }
  const result = helixStripeSandboxEventSchema.safeParse({
    ...candidate,
    payload_sha256: crypto.createHash("sha256").update(rawBody).digest("hex"),
  });
  return result.success ? result.data : null;
};

export const createStripeSandboxWebhookRouter = (dependencies: Readonly<{
  secret?: string;
  now?: () => Date;
  store?: BillingEntitlementStore;
}> = {}): Router => {
  const router = Router();
  const store = dependencies.store ?? billingEntitlementStore;
  router.post("/", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const secret = dependencies.secret ?? process.env.STRIPE_WEBHOOK_SECRET ?? "";
    if (!secret.startsWith("whsec_")) {
      return res.status(503).json({ ok: false, error: "stripe_sandbox_not_configured" });
    }
    const rawBody = Buffer.isBuffer(req.body) ? req.body : null;
    const signature = typeof req.headers["stripe-signature"] === "string"
      ? req.headers["stripe-signature"]
      : "";
    if (!rawBody || !verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: signature,
      secret,
      nowMs: (dependencies.now ?? (() => new Date()))().getTime(),
    })) {
      return res.status(400).json({ ok: false, error: "invalid_stripe_signature" });
    }
    const event = normalizeStripeEvent(rawBody);
    if (!event) {
      return res.status(202).json({
        ok: true,
        outcome: "ignored",
        live_mode: false,
        raw_processor_object_included: false,
      });
    }
    try {
      return res.status(200).json(await store.applyStripeEvent(event));
    } catch (error) {
      if (error instanceof BillingEntitlementStoreError) {
        return res.status(error.status).json({ ok: false, error: error.code });
      }
      throw error;
    }
  });
  return router;
};
