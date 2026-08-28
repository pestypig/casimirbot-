import { json, Router, type Request, type Response } from "express";
import {
  DESKTOP_AUTH0_STEP_UP_CALLBACK_PATH,
  DESKTOP_AUTH0_STEP_UP_DEVICE_RECOVER_PATH,
  DESKTOP_AUTH0_STEP_UP_DEVICE_REGISTER_PATH,
  DESKTOP_AUTH0_STEP_UP_DEVICE_REVOKE_PATH,
  DESKTOP_AUTH0_STEP_UP_INSPECT_PATH,
  DESKTOP_AUTH0_STEP_UP_SESSION_REVOKE_PATH,
  DESKTOP_AUTH0_STEP_UP_START_PATH,
  DESKTOP_AUTH0_STEP_UP_STATUS_PATH,
  helixInstalledSecurityStatusSchema,
  helixStepUpPurposeSchema,
  helixStepUpStartRequestSchema,
  helixStepUpStartReceiptSchema,
  type HelixStepUpPurpose,
} from "@shared/desktop-auth0-step-up";
import type { HelixAccountSession } from "@shared/helix-account-session";
import {
  isDesktopSessionAuthorized,
  resolveDesktopSessionConfig,
  type DesktopSessionConfig,
} from "../security/desktop-session";
import {
  Auth0StepUpController,
  Auth0StepUpError,
  auth0StepUpController,
  resolveAuth0StepUpConfig,
} from "../services/helix-account/auth0-step-up";
import {
  HelixStepUpReceiptError,
  type HelixStepUpReceiptStore,
  helixStepUpReceiptStore,
} from "../services/helix-account/auth0-step-up-receipt-store";
import {
  InstalledSecurityStoreError,
  installedDeviceRef,
  type InstalledSecurityStore,
  installedSecurityStore,
} from "../services/helix-account/installed-security-store";
import { getAccountSessionById } from
  "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from
  "../services/helix-account/session-cookie";
import {
  HELIX_BILLING_CHECKOUT_OPERATION_PATH,
  HELIX_BILLING_PORTAL_OPERATION_PATH,
  helixBillingCheckoutOperationSchema,
  helixBillingCheckoutTargetSchema,
  helixBillingPaymentTargetSchema,
  helixBillingPortalOperationSchema,
  helixBillingPortalTargetSchema,
} from "@shared/helix-billing-entitlement";
import {
  StripeSandboxClient,
  StripeSandboxClientError,
  stripeSandboxClient,
} from "../services/helix-account/stripe-sandbox-client";
import {
  BillingEntitlementStore,
  BillingEntitlementStoreError,
  billingEntitlementStore,
} from "../services/helix-account/billing-entitlement-store";

type ResolveSession = (sessionId: string | null) =>
  Promise<HelixAccountSession | null>;

export type DesktopAuth0StepUpRouterDependencies = Readonly<{
  controller?: Pick<Auth0StepUpController, "start" | "inspectStart" | "complete">;
  receipts?: Pick<HelixStepUpReceiptStore, "consumeNativeOperation" | "revokeBound">;
  security?: Pick<
    InstalledSecurityStore,
    "registerDevice" | "recoverDevice" | "revokeDevice" | "revokeSession" | "status"
  >;
  resolveSession?: ResolveSession;
  checkout?: Pick<
    StripeSandboxClient,
    "configured" | "createCheckout" | "createPortal"
  >;
  billing?: Pick<BillingEntitlementStore, "portalCustomerId">;
  desktopSession?: DesktopSessionConfig;
  env?: NodeJS.ProcessEnv;
}>;

const SAFE_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  desktop_required: "A valid native desktop session is required.",
  session_required: "An active developer profile session is required.",
  installed_services_locked: "Installed security management is not enabled for this account.",
  invalid_request: "The installed security request is invalid.",
  purpose_not_active: "That high-risk purpose belongs to a later SPB stage.",
  auth0_not_configured: "Auth0 MFA is not configured for this installed node.",
  invalid_callback: "The Auth0 MFA callback is invalid.",
  authorization_denied: "Auth0 did not authorize MFA step-up.",
  step_up_intent_not_found: "The MFA request was not found.",
  step_up_intent_expired: "The MFA request expired.",
  token_exchange_failed: "The Auth0 MFA token exchange failed.",
  identity_token_invalid: "The signed Auth0 MFA identity token is invalid.",
  identity_mismatch: "The Auth0 MFA identity did not match this profile.",
  scope_required: "The signed Auth0 access token lacks the required OIDC scope.",
  mfa_required: "The signed Auth0 identity does not prove MFA.",
  authentication_stale: "The Auth0 MFA authentication is not fresh.",
  receipt_invalid: "The step-up receipt is invalid.",
  receipt_expired: "The step-up receipt expired.",
  receipt_replayed: "The step-up receipt was already consumed.",
  receipt_revoked: "The step-up receipt was revoked.",
  receipt_binding_mismatch: "The step-up receipt does not authorize this operation.",
  device_not_registered: "The installed device is not active.",
  device_not_revoked: "The installed device is not eligible for recovery.",
  session_not_found: "The profile session was not found.",
  current_session_revoke_forbidden: "Use the ordinary sign-out control for the current session.",
  stripe_sandbox_not_configured: "Stripe sandbox Checkout is not configured for this installed node.",
  invalid_checkout_target: "The sandbox Checkout target is invalid.",
  invalid_portal_customer: "The sandbox Billing Portal customer is invalid.",
  portal_customer_unavailable: "No Stripe sandbox customer is available for subscription management.",
  stripe_sandbox_unavailable: "Stripe sandbox Checkout is temporarily unavailable.",
  invalid_stripe_checkout_response: "Stripe returned an invalid sandbox Checkout response.",
  invalid_stripe_portal_response: "Stripe returned an invalid sandbox Billing Portal response.",
  internal_error: "The installed security operation failed.",
});

const privateHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
};

const safeError = (res: Response, error: unknown): Response => {
  let status = 500;
  let code = "internal_error";
  if (
    error instanceof Auth0StepUpError ||
    error instanceof HelixStepUpReceiptError ||
    error instanceof InstalledSecurityStoreError ||
    error instanceof StripeSandboxClientError ||
    error instanceof BillingEntitlementStoreError
  ) {
    status = error.status;
    code = error.code;
  }
  privateHeaders(res);
  return res.status(status).json({
    schema: "helix.auth0_step_up_completion.v1",
    ok: false,
    error: code,
    message: SAFE_MESSAGES[code] ?? SAFE_MESSAGES.internal_error,
    usable_receipt_included: false,
    identity_token_included: false,
    access_token_included: false,
    factor_detail_included: false,
  });
};

const deviceIdFromEnv = (env: NodeJS.ProcessEnv): string => {
  const deviceId = env.HELIX_DESKTOP_DEVICE_ID?.trim() ?? "";
  if (!/^desktop_device_[A-Za-z0-9_-]{22}$/u.test(deviceId)) {
    throw new Auth0StepUpError(
      503,
      "invalid_request",
      "The native device identity is unavailable.",
    );
  }
  return deviceId;
};

const requireDesktop = (
  req: Request,
  desktopSession: DesktopSessionConfig,
): void => {
  if (
    !desktopSession.enabled ||
    !isDesktopSessionAuthorized(req.headers, desktopSession)
  ) {
    throw new Auth0StepUpError(
      401,
      "desktop_required",
      SAFE_MESSAGES.desktop_required,
    );
  }
};

const requireDeveloperSession = async (
  req: Request,
  resolveSession: ResolveSession,
): Promise<HelixAccountSession> => {
  const session = await resolveSession(
    readHelixSessionCookie(req.headers.cookie),
  );
  if (!session || session.status !== "active") {
    throw new InstalledSecurityStoreError(
      401,
      "session_required",
      SAFE_MESSAGES.session_required,
    );
  }
  if (
    session.account_policy.account_type !== "developer" ||
    !session.account_policy.feature_flags.includes("installed_service_management") ||
    session.account_policy.locked_features.includes("installed_service_management")
  ) {
    throw new Auth0StepUpError(
      403,
      "installed_services_locked",
      SAFE_MESSAGES.installed_services_locked,
    );
  }
  return session;
};

const ACTIVE_PURPOSES = new Set<HelixStepUpPurpose>([
  "device_register",
  "device_recover",
  "device_revoke",
  "session_revoke",
  "payment_change",
]);

export const createDesktopAuth0StepUpRouter = (
  dependencies: DesktopAuth0StepUpRouterDependencies = {},
): Router => {
  const router = Router();
  const env = dependencies.env ?? process.env;
  const desktopSession = dependencies.desktopSession ??
    resolveDesktopSessionConfig(env);
  const controller = dependencies.controller ?? auth0StepUpController;
  const receipts = dependencies.receipts ?? helixStepUpReceiptStore;
  const security = dependencies.security ?? installedSecurityStore;
  const checkout = dependencies.checkout ?? stripeSandboxClient;
  const billing = dependencies.billing ?? billingEntitlementStore;
  const resolveSession = dependencies.resolveSession ?? getAccountSessionById;
  const relative = (path: string): string => path.replace("/api/account", "");

  router.use(json({ limit: "12kb", strict: true }));

  router.post(relative(DESKTOP_AUTH0_STEP_UP_START_PATH), async (req, res) => {
    try {
      requireDesktop(req, desktopSession);
      const session = await requireDeveloperSession(req, resolveSession);
      const parsed = helixStepUpStartRequestSchema.safeParse(req.body);
      if (
        !parsed.success ||
        !ACTIVE_PURPOSES.has(parsed.data.purpose) ||
        (parsed.data.purpose === "payment_change" && !checkout.configured())
      ) {
        throw new Auth0StepUpError(
          409,
          parsed.success ? "purpose_not_active" : "invalid_request",
          parsed.success ? SAFE_MESSAGES.purpose_not_active : SAFE_MESSAGES.invalid_request,
        );
      }
      const deviceId = deviceIdFromEnv(env);
      const targetRef = parsed.data.purpose === "session_revoke" ||
          parsed.data.purpose === "payment_change"
        ? parsed.data.target_ref
        : installedDeviceRef(deviceId);
      if (
        (parsed.data.purpose === "session_revoke" && !targetRef) ||
        (parsed.data.purpose === "payment_change" &&
          !helixBillingPaymentTargetSchema.safeParse(targetRef).success)
      ) {
        throw new Auth0StepUpError(400, "invalid_request", SAFE_MESSAGES.invalid_request);
      }
      const receipt = helixStepUpStartReceiptSchema.parse(controller.start({
        session: {
          sessionId: session.session_id,
          profileId: session.profile.profile_id,
        },
        deviceId,
        purpose: parsed.data.purpose,
        targetRef,
      }));
      privateHeaders(res);
      res.status(200).json(receipt);
    } catch (error) {
      safeError(res, error);
    }
  });

  router.post(relative(DESKTOP_AUTH0_STEP_UP_INSPECT_PATH), (req, res) => {
    try {
      requireDesktop(req, desktopSession);
      const inspected = controller.inspectStart(req.body?.authorization_url);
      privateHeaders(res);
      res.status(200).json({
        schema: "helix.auth0_step_up_intent_projection.v1",
        ok: true,
        ...inspected,
        usable_receipt_included: false,
        identity_token_included: false,
        access_token_included: false,
        factor_detail_included: false,
      });
    } catch (error) {
      safeError(res, error);
    }
  });

  router.post(relative(DESKTOP_AUTH0_STEP_UP_CALLBACK_PATH), async (req, res) => {
    try {
      requireDesktop(req, desktopSession);
      const completed = await controller.complete(req.body?.callback_url);
      privateHeaders(res);
      // This usable token is returned only to the Electron main process over
      // the authenticated private loopback channel. Main consumes it
      // immediately for SPB-3 device/session operations and never forwards it.
      res.status(200).json({
        schema: "helix.auth0_step_up_native_completion.v1",
        ok: true,
        ...completed,
        native_main_only: true,
        identity_token_included: false,
        access_token_included: false,
        factor_detail_included: false,
      });
    } catch (error) {
      safeError(res, error);
    }
  });

  router.get(relative(DESKTOP_AUTH0_STEP_UP_STATUS_PATH), async (req, res) => {
    try {
      requireDesktop(req, desktopSession);
      const session = await requireDeveloperSession(req, resolveSession);
      let configured = true;
      let maximumAgeSeconds = 5 * 60;
      try {
        maximumAgeSeconds = resolveAuth0StepUpConfig(env).maximumAgeSeconds;
      } catch {
        configured = false;
      }
      const status = helixInstalledSecurityStatusSchema.parse(await security.status({
        session: {
          sessionId: session.session_id,
          profileId: session.profile.profile_id,
        },
        deviceId: deviceIdFromEnv(env),
        auth0Configured: configured,
        maximumAgeSeconds,
      }));
      privateHeaders(res);
      res.status(200).json(status);
    } catch (error) {
      safeError(res, error);
    }
  });

  const operation = (
    path: string,
    purpose: HelixStepUpPurpose,
    apply: (input: {
      session: { sessionId: string; profileId: string };
      deviceId: string;
      targetRef: string | null;
    }) => Promise<void>,
  ): void => {
    router.post(relative(path), async (req, res) => {
      try {
        requireDesktop(req, desktopSession);
        const deviceId = deviceIdFromEnv(env);
        const consumed = receipts.consumeNativeOperation({
          token: req.body?.receipt_token,
          deviceId,
          purpose,
        });
        const session = {
          sessionId: consumed.binding.sessionId,
          profileId: consumed.binding.profileId,
        };
        await apply({ session, deviceId, targetRef: consumed.binding.targetRef });
        if (purpose === "device_revoke" || purpose === "session_revoke") {
          receipts.revokeBound({
            profileId: session.profileId,
            ...(purpose === "device_revoke" ? { deviceId } : {}),
          });
        }
        privateHeaders(res);
        res.status(200).json({
          schema: "helix.installed_security_operation.v1",
          ok: true,
          operation: purpose,
          receipt_ref: consumed.projection.receipt_ref,
          operation_applied: true,
          usable_receipt_included: false,
          identity_token_included: false,
          access_token_included: false,
          factor_detail_included: false,
        });
      } catch (error) {
        safeError(res, error);
      }
    });
  };

  operation(DESKTOP_AUTH0_STEP_UP_DEVICE_REGISTER_PATH, "device_register", async ({ session, deviceId }) => {
    await security.registerDevice({ session, deviceId });
  });
  operation(DESKTOP_AUTH0_STEP_UP_DEVICE_RECOVER_PATH, "device_recover", async ({ session, deviceId }) => {
    await security.recoverDevice({ session, deviceId });
  });
  operation(DESKTOP_AUTH0_STEP_UP_DEVICE_REVOKE_PATH, "device_revoke", async ({ session, deviceId }) => {
    await security.revokeDevice({ session, deviceId });
  });
  operation(DESKTOP_AUTH0_STEP_UP_SESSION_REVOKE_PATH, "session_revoke", async ({ session, targetRef }) => {
    if (!targetRef) {
      throw new Auth0StepUpError(400, "invalid_request", SAFE_MESSAGES.invalid_request);
    }
    await security.revokeSession({ session, targetSessionRef: targetRef });
  });

  router.post(relative(HELIX_BILLING_CHECKOUT_OPERATION_PATH), async (req, res) => {
    try {
      requireDesktop(req, desktopSession);
      if (!checkout.configured()) {
        throw new StripeSandboxClientError(503, "stripe_sandbox_not_configured", SAFE_MESSAGES.stripe_sandbox_not_configured);
      }
      const deviceId = deviceIdFromEnv(env);
      const consumed = receipts.consumeNativeOperation({
        token: req.body?.receipt_token,
        deviceId,
        purpose: "payment_change",
      });
      const target = helixBillingCheckoutTargetSchema.safeParse(consumed.binding.targetRef);
      if (!target.success) {
        throw new StripeSandboxClientError(400, "invalid_checkout_target", SAFE_MESSAGES.invalid_checkout_target);
      }
      const installed = await security.status({
        session: {
          sessionId: consumed.binding.sessionId,
          profileId: consumed.binding.profileId,
        },
        deviceId,
        auth0Configured: true,
        maximumAgeSeconds: 300,
      });
      if (installed.current_device.status !== "active") {
        throw new InstalledSecurityStoreError(409, "device_not_registered", SAFE_MESSAGES.device_not_registered);
      }
      const created = await checkout.createCheckout({
        profileId: consumed.binding.profileId,
        targetRef: target.data,
        idempotencyKey: `checkout:${consumed.projection.receipt_ref}`,
      });
      privateHeaders(res);
      res.status(200).json(helixBillingCheckoutOperationSchema.parse({
        schema: "helix.billing_checkout_operation.v1",
        ok: true,
        operation: "payment_change",
        receipt_ref: consumed.projection.receipt_ref,
        hosted_url: created.hostedUrl,
        target_ref: target.data,
        operation_applied: true,
        payment_instrument_included: false,
        stripe_secret_included: false,
        raw_processor_object_included: false,
      }));
    } catch (error) {
      safeError(res, error);
    }
  });

  router.post(relative(HELIX_BILLING_PORTAL_OPERATION_PATH), async (req, res) => {
    try {
      requireDesktop(req, desktopSession);
      if (!checkout.configured()) {
        throw new StripeSandboxClientError(503, "stripe_sandbox_not_configured", SAFE_MESSAGES.stripe_sandbox_not_configured);
      }
      const deviceId = deviceIdFromEnv(env);
      const consumed = receipts.consumeNativeOperation({
        token: req.body?.receipt_token,
        deviceId,
        purpose: "payment_change",
      });
      const target = helixBillingPortalTargetSchema.safeParse(
        consumed.binding.targetRef,
      );
      if (!target.success) {
        throw new StripeSandboxClientError(
          400,
          "invalid_checkout_target",
          SAFE_MESSAGES.invalid_checkout_target,
        );
      }
      const installed = await security.status({
        session: {
          sessionId: consumed.binding.sessionId,
          profileId: consumed.binding.profileId,
        },
        deviceId,
        auth0Configured: true,
        maximumAgeSeconds: 300,
      });
      if (installed.current_device.status !== "active") {
        throw new InstalledSecurityStoreError(
          409,
          "device_not_registered",
          SAFE_MESSAGES.device_not_registered,
        );
      }
      const customerId = await billing.portalCustomerId(
        consumed.binding.profileId,
      );
      const created = await checkout.createPortal({
        customerId,
        idempotencyKey: `portal:${consumed.projection.receipt_ref}`,
      });
      privateHeaders(res);
      res.status(200).json(helixBillingPortalOperationSchema.parse({
        schema: "helix.billing_portal_operation.v1",
        ok: true,
        operation: "payment_change",
        receipt_ref: consumed.projection.receipt_ref,
        hosted_url: created.hostedUrl,
        target_ref: target.data,
        operation_applied: true,
        customer_reference_included: false,
        payment_instrument_included: false,
        stripe_secret_included: false,
        raw_processor_object_included: false,
      }));
    } catch (error) {
      safeError(res, error);
    }
  });

  return router;
};
