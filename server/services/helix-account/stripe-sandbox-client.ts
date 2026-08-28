import {
  helixBillingCheckoutTargetSchema,
  type HelixBillingCheckoutTarget,
} from "@shared/helix-billing-entitlement";

export class StripeSandboxClientError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "stripe_sandbox_not_configured"
      | "invalid_checkout_target"
      | "invalid_portal_customer"
      | "stripe_sandbox_unavailable"
      | "invalid_stripe_checkout_response"
      | "invalid_stripe_portal_response",
    message: string,
  ) {
    super(message);
    this.name = "StripeSandboxClientError";
  }
}

export type StripeSandboxConfig = Readonly<{
  secretKey: string;
  planPriceId: string;
  prepaidPriceId: string;
  successUrl: string;
  cancelUrl: string;
  portalReturnUrl: string;
}>;

const validReturnUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const resolveStripeSandboxConfig = (
  env: NodeJS.ProcessEnv = process.env,
): StripeSandboxConfig => {
  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? "";
  const planPriceId = env.STRIPE_SANDBOX_PLAN_PRICE_ID?.trim() ?? "";
  const prepaidPriceId = env.STRIPE_SANDBOX_PREPAID_PRICE_ID?.trim() ?? "";
  const successUrl = env.STRIPE_SANDBOX_SUCCESS_URL?.trim() ?? "";
  const cancelUrl = env.STRIPE_SANDBOX_CANCEL_URL?.trim() ?? "";
  const portalReturnUrl = env.STRIPE_SANDBOX_PORTAL_RETURN_URL?.trim() ?? "";
  if (
    !/^sk_test_[A-Za-z0-9_]+$/u.test(secretKey) ||
    !/^price_[A-Za-z0-9]+$/u.test(planPriceId) ||
    !/^price_[A-Za-z0-9]+$/u.test(prepaidPriceId) ||
    !validReturnUrl(successUrl) ||
    !validReturnUrl(cancelUrl) ||
    !validReturnUrl(portalReturnUrl)
  ) {
    throw new StripeSandboxClientError(
      503,
      "stripe_sandbox_not_configured",
      "Stripe sandbox Checkout is not configured.",
    );
  }
  return {
    secretKey,
    planPriceId,
    prepaidPriceId,
    successUrl,
    cancelUrl,
    portalReturnUrl,
  };
};

const stripeHostedUrl = (value: unknown, hostname: string): string | null => {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === hostname &&
      !parsed.username && !parsed.password
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
};

export class StripeSandboxClient {
  constructor(private readonly dependencies: Readonly<{
    env?: NodeJS.ProcessEnv;
    fetch?: typeof fetch;
  }> = {}) {}

  configured(): boolean {
    try {
      resolveStripeSandboxConfig(this.dependencies.env ?? process.env);
      return true;
    } catch {
      return false;
    }
  }

  async createCheckout(input: {
    profileId: string;
    targetRef: HelixBillingCheckoutTarget;
    idempotencyKey: string;
  }): Promise<{ hostedUrl: string }> {
    const target = helixBillingCheckoutTargetSchema.safeParse(input.targetRef);
    if (!target.success || !/^[A-Za-z0-9:_-]{8,200}$/u.test(input.idempotencyKey)) {
      throw new StripeSandboxClientError(400, "invalid_checkout_target", "The sandbox Checkout target is invalid.");
    }
    const config = resolveStripeSandboxConfig(this.dependencies.env ?? process.env);
    const plan = target.data === "billing_checkout:plan:starter_monthly";
    const body = new URLSearchParams();
    body.set("mode", plan ? "subscription" : "payment");
    body.set("line_items[0][price]", plan ? config.planPriceId : config.prepaidPriceId);
    body.set("line_items[0][quantity]", "1");
    body.set("success_url", config.successUrl);
    body.set("cancel_url", config.cancelUrl);
    body.set("client_reference_id", input.profileId);
    body.set("metadata[casimir_profile_id]", input.profileId);
    body.set("metadata[casimir_purchase_kind]", plan ? "plan" : "prepaid");
    if (plan) {
      body.set("metadata[casimir_plan_id]", "starter_monthly");
      body.set("metadata[casimir_included_credit_minor]", "1000");
      body.set("subscription_data[metadata][casimir_profile_id]", input.profileId);
      body.set("subscription_data[metadata][casimir_plan_id]", "starter_monthly");
    }
    if (!plan) {
      body.set("payment_intent_data[metadata][casimir_profile_id]", input.profileId);
      body.set("payment_intent_data[metadata][casimir_purchase_kind]", "prepaid");
    }
    let response: Response;
    try {
      response = await (this.dependencies.fetch ?? fetch)(
        "https://api.stripe.com/v1/checkout/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Idempotency-Key": input.idempotencyKey,
          },
          body,
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new StripeSandboxClientError(502, "stripe_sandbox_unavailable", "Stripe sandbox Checkout is unavailable.");
    }
    if (!response.ok) {
      throw new StripeSandboxClientError(502, "stripe_sandbox_unavailable", "Stripe sandbox Checkout was rejected.");
    }
    const candidate = await response.json().catch(() => null) as Record<string, unknown> | null;
    const hostedUrl = stripeHostedUrl(candidate?.url, "checkout.stripe.com");
    if (!hostedUrl || candidate?.livemode === true) {
      throw new StripeSandboxClientError(502, "invalid_stripe_checkout_response", "Stripe returned an invalid sandbox Checkout response.");
    }
    return { hostedUrl };
  }

  async createPortal(input: {
    customerId: string;
    idempotencyKey: string;
  }): Promise<{ hostedUrl: string }> {
    if (
      !/^cus_[A-Za-z0-9]+$/u.test(input.customerId) ||
      !/^[A-Za-z0-9:_-]{8,200}$/u.test(input.idempotencyKey)
    ) {
      throw new StripeSandboxClientError(
        400,
        "invalid_portal_customer",
        "The sandbox Billing Portal customer is invalid.",
      );
    }
    const config = resolveStripeSandboxConfig(this.dependencies.env ?? process.env);
    const body = new URLSearchParams();
    body.set("customer", input.customerId);
    body.set("return_url", config.portalReturnUrl);
    let response: Response;
    try {
      response = await (this.dependencies.fetch ?? fetch)(
        "https://api.stripe.com/v1/billing_portal/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Idempotency-Key": input.idempotencyKey,
          },
          body,
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new StripeSandboxClientError(
        502,
        "stripe_sandbox_unavailable",
        "Stripe sandbox Billing Portal is unavailable.",
      );
    }
    if (!response.ok) {
      throw new StripeSandboxClientError(
        502,
        "stripe_sandbox_unavailable",
        "Stripe sandbox Billing Portal was rejected.",
      );
    }
    const candidate = await response.json().catch(() => null) as
      Record<string, unknown> | null;
    const hostedUrl = stripeHostedUrl(candidate?.url, "billing.stripe.com");
    if (!hostedUrl || candidate?.livemode === true) {
      throw new StripeSandboxClientError(
        502,
        "invalid_stripe_portal_response",
        "Stripe returned an invalid sandbox Billing Portal response.",
      );
    }
    return { hostedUrl };
  }
}

export const stripeSandboxClient = new StripeSandboxClient();
