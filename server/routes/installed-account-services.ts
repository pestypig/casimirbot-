import { Router, type Request, type Response } from "express";
import { buildHelixInstalledAccountServices } from
  "@shared/helix-installed-account-services";
import type { HelixAccountSession } from "@shared/helix-account-session";
import {
  isDesktopSessionAuthorized,
  resolveDesktopSessionConfig,
  type DesktopSessionConfig,
} from "../security/desktop-session";
import { getAccountSessionById } from
  "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from
  "../services/helix-account/session-cookie";
import type { HelixBillingEntitlement } from
  "@shared/helix-billing-entitlement";
import { billingEntitlementStore } from
  "../services/helix-account/billing-entitlement-store";

type ResolveSession = (
  sessionId: string | null,
) => Promise<HelixAccountSession | null>;

export type InstalledAccountServicesRouterDependencies = Readonly<{
  desktopSession?: DesktopSessionConfig;
  env?: NodeJS.ProcessEnv;
  resolveSession?: ResolveSession;
  resolveBilling?: (profileId: string) => Promise<HelixBillingEntitlement>;
  now?: () => Date;
}>;

const brokerReady = (env: NodeJS.ProcessEnv): boolean => {
  const origin = env.HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN?.trim() ?? "";
  const token = env.HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN?.trim() ?? "";
  if (!origin || !token) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:" &&
      parsed.hostname === "127.0.0.1" &&
      Boolean(parsed.port) &&
      parsed.pathname === "/" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      /^[A-Za-z0-9_-]{43}$/u.test(token) &&
      Buffer.from(token, "base64url").length === 32;
  } catch {
    return false;
  }
};

export const createInstalledAccountServicesRouter = (
  dependencies: InstalledAccountServicesRouterDependencies = {},
): Router => {
  const router = Router();
  const env = dependencies.env ?? process.env;
  const desktopSession = dependencies.desktopSession ??
    resolveDesktopSessionConfig(env);
  const resolveSession = dependencies.resolveSession ?? getAccountSessionById;
  const resolveBilling = dependencies.resolveBilling ??
    ((profileId: string) => billingEntitlementStore.status(profileId));
  const now = dependencies.now ?? (() => new Date());

  router.get("/installed-services", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!desktopSession.enabled) {
      return res.status(409).json({
        ok: false,
        error: "installed_node_required",
        message: "Open the installed CasimirBot application to manage device services.",
        raw_credential_included: false,
        payment_instrument_included: false,
      });
    }
    if (!isDesktopSessionAuthorized(req.headers, desktopSession)) {
      return res.status(401).json({
        ok: false,
        error: "desktop_session_required",
        message: "A valid native desktop session is required.",
        raw_credential_included: false,
        payment_instrument_included: false,
      });
    }
    const session = await resolveSession(
      readHelixSessionCookie(req.headers.cookie),
    );
    if (!session || session.status !== "active") {
      return res.status(401).json({
        ok: false,
        error: "profile_session_required",
        message: "Sign in to a developer profile in the installed application.",
        raw_credential_included: false,
        payment_instrument_included: false,
      });
    }
    if (
      session.account_policy.account_type !== "developer" ||
      !session.account_policy.feature_flags.includes(
        "installed_service_management",
      ) ||
      session.account_policy.locked_features.includes(
        "installed_service_management",
      )
    ) {
      return res.status(403).json({
        ok: false,
        error: "installed_services_locked",
        message: "Installed service management is not enabled for this account.",
        raw_credential_included: false,
        payment_instrument_included: false,
      });
    }
    return res.status(200).json(buildHelixInstalledAccountServices({
      profileRef: session.profile.profile_id,
      providerCredentialBrokerReady: brokerReady(env),
      now: now(),
    }));
  });

  router.get("/billing-entitlement", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const denied = (status: number, error: string, message: string) =>
      res.status(status).json({
        ok: false,
        error,
        message,
        payment_instrument_included: false,
        raw_processor_object_included: false,
      });
    if (!desktopSession.enabled) {
      return denied(409, "installed_node_required", "Open the installed CasimirBot application to inspect billing.");
    }
    if (!isDesktopSessionAuthorized(req.headers, desktopSession)) {
      return denied(401, "desktop_session_required", "A valid native desktop session is required.");
    }
    const session = await resolveSession(readHelixSessionCookie(req.headers.cookie));
    if (!session || session.status !== "active") {
      return denied(401, "profile_session_required", "Sign in to a developer profile in the installed application.");
    }
    if (
      session.account_policy.account_type !== "developer" ||
      !session.account_policy.feature_flags.includes("installed_service_management") ||
      session.account_policy.locked_features.includes("installed_service_management")
    ) {
      return denied(403, "installed_services_locked", "Installed billing status is not enabled for this account.");
    }
    return res.status(200).json(await resolveBilling(session.profile.profile_id));
  });

  return router;
};
