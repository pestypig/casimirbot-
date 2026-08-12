import { json, Router, type Request, type Response } from "express";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH,
  DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA,
  DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH,
} from "@shared/desktop-auth0-account-link";
import {
  isDesktopSessionAuthorized,
  resolveDesktopSessionConfig,
  type DesktopSessionConfig,
} from "../security/desktop-session";
import {
  HelixAgentAccountLinkError,
  type HelixAgentAccountLinkSession,
} from "../services/helix-account/agent-account-link-store";
import {
  Auth0NativeAccountLinkController,
  Auth0NativeAccountLinkError,
  auth0NativeAccountLinkController,
} from "../services/helix-account/auth0-native-account-link";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import type { HelixAgentAccountBindingSessionRecord } from "./helix-agent-account-bindings";

type ResolveSession = (
  sessionId?: string | null,
) => Promise<HelixAgentAccountBindingSessionRecord | null>;

export type DesktopAuth0AccountLinkRouterDependencies = Readonly<{
  controller?: Pick<Auth0NativeAccountLinkController, "start" | "complete">;
  resolveSession?: ResolveSession;
  desktopSession?: DesktopSessionConfig;
}>;

const SAFE_MESSAGES = {
  desktop_required: "A valid native desktop session is required.",
  session_required:
    "An active Helix account session is required to link Auth0.",
  auth0_not_configured:
    "The Auth0 native account-link profile is not configured.",
  invalid_callback: "The desktop OAuth callback is invalid.",
  authorization_denied: "Auth0 did not authorize the account link.",
  link_intent_not_found: "The desktop OAuth link request was not found.",
  link_intent_expired: "The desktop OAuth link request has expired.",
  token_exchange_failed: "The Auth0 token exchange failed.",
  signed_tenant_claim_missing:
    "The Auth0 access token is missing the configured signed tenant claim.",
  verified_identity_mismatch:
    "The verified Auth0 identity did not match the account-link profile.",
  internal_error: "The Auth0 account-link request could not be completed.",
} as const;

type SafeCode = keyof typeof SAFE_MESSAGES;

const privateHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
};

const safeError = (res: Response, error: unknown): Response => {
  let status = 500;
  let code: SafeCode = "internal_error";
  if (error instanceof Auth0NativeAccountLinkError) {
    status = error.status >= 400 && error.status < 600 ? error.status : 500;
    code = error.code;
  } else if (
    error instanceof HelixAgentAccountLinkError &&
    error.code === "session_required"
  ) {
    status = 401;
    code = "session_required";
  }
  console.warn(
    `[desktop-auth0-account-link] request failed code=${code} status=${status}`,
  );
  privateHeaders(res);
  return res.status(status).json({
    schema: DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA,
    ok: false,
    error: code,
    message: SAFE_MESSAGES[code],
    bearer_included: false,
    subject_included: false,
  });
};

const requireDesktop = (
  req: Request,
  desktopSession: DesktopSessionConfig,
): void => {
  if (
    !desktopSession.enabled ||
    !isDesktopSessionAuthorized(req.headers, desktopSession)
  ) {
    throw new Auth0NativeAccountLinkError(
      401,
      "desktop_required",
      SAFE_MESSAGES.desktop_required,
    );
  }
};

const requireAccountSession = async (
  req: Request,
  resolveSession: ResolveSession,
): Promise<HelixAgentAccountLinkSession> => {
  const sessionId = readHelixSessionCookie(req.headers.cookie);
  const session = sessionId ? await resolveSession(sessionId) : null;
  if (!session) {
    throw new HelixAgentAccountLinkError(
      401,
      "session_required",
      SAFE_MESSAGES.session_required,
    );
  }
  return {
    sessionId: session.session_id,
    profileId: session.profile.profile_id,
  };
};

export const createDesktopAuth0AccountLinkRouter = (
  dependencies: DesktopAuth0AccountLinkRouterDependencies = {},
): Router => {
  const router = Router();
  const controller =
    dependencies.controller ?? auth0NativeAccountLinkController;
  const resolveSession = dependencies.resolveSession ?? getAccountSessionById;
  const desktopSession =
    dependencies.desktopSession ?? resolveDesktopSessionConfig(process.env);

  router.post(
    DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH.replace("/api/account", ""),
    async (req: Request, res: Response): Promise<void> => {
      try {
        requireDesktop(req, desktopSession);
        const session = await requireAccountSession(req, resolveSession);
        const receipt = await controller.start(session);
        privateHeaders(res);
        res.status(200).json(receipt);
      } catch (error) {
        safeError(res, error);
      }
    },
  );

  router.post(
    DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH.replace("/api/account", ""),
    json({ limit: "8kb", strict: true }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        requireDesktop(req, desktopSession);
        const receipt = await controller.complete(req.body?.callback_url);
        privateHeaders(res);
        res.status(200).json({
          schema: DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA,
          ok: true,
          binding: receipt.binding,
          bearer_included: false,
          subject_included: false,
        });
      } catch (error) {
        safeError(res, error);
      }
    },
  );

  router.use(
    (
      error: unknown,
      req: Request,
      res: Response,
      next: (error?: unknown) => void,
    ): void => {
      if (
        req.path ===
        DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH.replace("/api/account", "")
      ) {
        safeError(
          res,
          new Auth0NativeAccountLinkError(
            400,
            "invalid_callback",
            SAFE_MESSAGES.invalid_callback,
          ),
        );
        return;
      }
      next(error);
    },
  );

  return router;
};
