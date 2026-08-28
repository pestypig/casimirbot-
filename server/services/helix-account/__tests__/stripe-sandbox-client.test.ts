import { describe, expect, it, vi } from "vitest";
import {
  StripeSandboxClient,
  resolveStripeSandboxConfig,
} from "../stripe-sandbox-client";

const ENV = {
  STRIPE_SECRET_KEY: "sk_test_sandboxOnly",
  STRIPE_SANDBOX_PLAN_PRICE_ID: "price_Plan123",
  STRIPE_SANDBOX_PREPAID_PRICE_ID: "price_Topup123",
  STRIPE_SANDBOX_SUCCESS_URL: "https://casimirbot.example/billing/success",
  STRIPE_SANDBOX_CANCEL_URL: "https://casimirbot.example/billing/cancel",
  STRIPE_SANDBOX_PORTAL_RETURN_URL: "https://casimirbot.example/account/billing",
} satisfies NodeJS.ProcessEnv;

describe("StripeSandboxClient", () => {
  it("rejects live keys and non-HTTPS return URLs", () => {
    expect(() => resolveStripeSandboxConfig({
      ...ENV,
      STRIPE_SECRET_KEY: "sk_live_forbidden",
    })).toThrowError(expect.objectContaining({ code: "stripe_sandbox_not_configured" }));
    expect(() => resolveStripeSandboxConfig({
      ...ENV,
      STRIPE_SANDBOX_SUCCESS_URL: "http://localhost/success",
    })).toThrowError(expect.objectContaining({ code: "stripe_sandbox_not_configured" }));
  });

  it("creates hosted plan Checkout with exact metadata and no returned processor object", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: "cs_test_secret_session_id",
      url: "https://checkout.stripe.com/c/pay/cs_test_redacted",
      livemode: false,
      customer: "cus_secret",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = new StripeSandboxClient({ env: ENV, fetch: fetchMock });
    const result = await client.createCheckout({
      profileId: "profile-owner",
      targetRef: "billing_checkout:plan:starter_monthly",
      idempotencyKey: "checkout:receipt-ref-123",
    });
    expect(result).toEqual({ hostedUrl: "https://checkout.stripe.com/c/pay/cs_test_redacted" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toMatchObject({
      Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
      "Idempotency-Key": "checkout:receipt-ref-123",
    });
    const body = init?.body as URLSearchParams;
    expect(body.get("mode")).toBe("subscription");
    expect(body.get("metadata[casimir_profile_id]")).toBe("profile-owner");
    expect(body.get("metadata[casimir_included_credit_minor]")).toBe("1000");
    expect(body.get("subscription_data[metadata][casimir_profile_id]"))
      .toBe("profile-owner");
    expect(JSON.stringify(result)).not.toContain("cus_secret");
    expect(JSON.stringify(result)).not.toContain("cs_test_secret_session_id");
  });

  it("rejects a non-Stripe hosted URL even from a successful response", async () => {
    const client = new StripeSandboxClient({
      env: ENV,
      fetch: vi.fn(async () => new Response(JSON.stringify({
        url: "https://attacker.example/checkout",
        livemode: false,
      }), { status: 200 })),
    });
    await expect(client.createCheckout({
      profileId: "profile-owner",
      targetRef: "billing_checkout:prepaid:500",
      idempotencyKey: "checkout:receipt-ref-456",
    })).rejects.toMatchObject({ code: "invalid_stripe_checkout_response" });
  });

  it("creates a hosted Billing Portal session without returning the customer reference", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: "bps_secret_session_id",
      url: "https://billing.stripe.com/p/session/portal_redacted",
      livemode: false,
      customer: "cus_owner1",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = new StripeSandboxClient({ env: ENV, fetch: fetchMock });
    const result = await client.createPortal({
      customerId: "cus_owner1",
      idempotencyKey: "portal:receipt-ref-789",
    });
    expect(result).toEqual({
      hostedUrl: "https://billing.stripe.com/p/session/portal_redacted",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/billing_portal/sessions");
    expect(init?.headers).toMatchObject({
      Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
      "Idempotency-Key": "portal:receipt-ref-789",
    });
    const body = init?.body as URLSearchParams;
    expect(body.get("customer")).toBe("cus_owner1");
    expect(body.get("return_url")).toBe(ENV.STRIPE_SANDBOX_PORTAL_RETURN_URL);
    expect(JSON.stringify(result)).not.toContain("cus_owner1");
    expect(JSON.stringify(result)).not.toContain("bps_secret_session_id");
  });

  it("rejects an unexpected Billing Portal hostname", async () => {
    const client = new StripeSandboxClient({
      env: ENV,
      fetch: vi.fn(async () => new Response(JSON.stringify({
        url: "https://checkout.stripe.com/c/pay/not-a-portal",
        livemode: false,
      }), { status: 200 })),
    });
    await expect(client.createPortal({
      customerId: "cus_owner1",
      idempotencyKey: "portal:receipt-ref-bad",
    })).rejects.toMatchObject({ code: "invalid_stripe_portal_response" });
  });
});
