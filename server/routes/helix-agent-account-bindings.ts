import { Router, type Request, type Response } from "express";
import type { HelixAccountSession } from "@shared/helix-account-session";
import {
  HelixAgentAccountLinkError,
  helixAgentAccountLinkStore,
  type HelixAgentAccountLinkStore,
} from "../services/helix-account/agent-account-link-store";
import {
  DefaultHelixAgentAccessTokenVerifier,
  type HelixAgentAccessTokenVerifier,
} from "../auth/helix-agent-principal";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";

export const HELIX_AGENT_ACCOUNT_BINDING_ERROR_SCHEMA =
  "helix.agent_account_binding_error.v1" as const;

export type HelixAgentAccountBindingSessionRecord = Pick<
  HelixAccountSession,
  "session_id"
> & {
  profile: Pick<HelixAccountSession["profile"], "profile_id">;
};

export type HelixAgentAccountBindingManagementStore = Pick<
  HelixAgentAccountLinkStore,
  "listBindings" | "revokeBinding"
>;

type ResolveSession = (
  sessionId?: string | null,
) => Promise<HelixAgentAccountBindingSessionRecord | null>;

export type HelixAgentAccountBindingsRouterDependencies = {
  store?: HelixAgentAccountBindingManagementStore;
  linkStore?: Pick<
    HelixAgentAccountLinkStore,
    "createLinkIntent" | "completeLinkIntent"
  >;
  verifier?: HelixAgentAccessTokenVerifier;
  resolveSession?: ResolveSession;
};

type LinkErrorCode = HelixAgentAccountLinkError["code"];
type RouteErrorCode = LinkErrorCode | "internal_error";

const SAFE_ERROR_MESSAGES: Record<RouteErrorCode, string> = {
  invalid_request: "The agent account binding request is invalid.",
  session_required:
    "An active Helix account session is required to manage agent bindings.",
  link_intent_not_found: "The agent account-link request was not found.",
  link_intent_mismatch:
    "The agent account-link request does not match this account session.",
  link_intent_expired: "The agent account-link request has expired.",
  link_intent_consumed:
    "The agent account-link request has already been consumed.",
  provider_subject_conflict:
    "The verified provider identity is linked to another Helix profile.",
  binding_conflict:
    "The verified agent binding belongs to another Helix profile.",
  binding_revoked:
    "The agent account binding is revoked and requires explicit reactivation.",
  binding_not_found: "The agent account binding was not found.",
  internal_error: "The agent account binding request could not be completed.",
};

const setPrivateResponseHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
};

const safeError = (res: Response, error: unknown): Response => {
  const isLinkError = error instanceof HelixAgentAccountLinkError;
  const code: RouteErrorCode = isLinkError ? error.code : "internal_error";
  const status =
    isLinkError && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  setPrivateResponseHeaders(res);
  return res.status(status).json({
    schema: HELIX_AGENT_ACCOUNT_BINDING_ERROR_SCHEMA,
    ok: false,
    error: code,
    message: SAFE_ERROR_MESSAGES[code],
    subject_included: false,
    bearer_included: false,
  });
};

const requireActiveSession = async (
  req: Request,
  resolveSession: ResolveSession,
): Promise<{
  sessionId: string;
  profileId: string;
}> => {
  const cookieSessionId = readHelixSessionCookie(req.headers.cookie);
  if (!cookieSessionId) {
    throw new HelixAgentAccountLinkError(
      401,
      "session_required",
      SAFE_ERROR_MESSAGES.session_required,
    );
  }
  const session = await resolveSession(cookieSessionId);
  if (!session) {
    throw new HelixAgentAccountLinkError(
      401,
      "session_required",
      SAFE_ERROR_MESSAGES.session_required,
    );
  }
  return {
    sessionId: session.session_id,
    profileId: session.profile.profile_id,
  };
};

const bearerToken = (req: Request): string => {
  const match = (req.get("authorization") ?? "").match(/^Bearer ([^\s]+)$/u);
  if (!match || match[1].length > 32_768) {
    throw new HelixAgentAccountLinkError(
      401,
      "invalid_request",
      "A verified OAuth bearer token is required.",
    );
  }
  return match[1];
};

export const createHelixAgentAccountBindingsRouter = (
  dependencies: HelixAgentAccountBindingsRouterDependencies = {},
): Router => {
  const router = Router();
  const store = dependencies.store ?? helixAgentAccountLinkStore;
  const linkStore = dependencies.linkStore ?? helixAgentAccountLinkStore;
  const verifier =
    dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier();
  const resolveSession = dependencies.resolveSession ?? getAccountSessionById;

  router.post(
    "/session/agent-bindings/oauth/complete",
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (req.get("x-helix-agent-link-confirm") !== "bind-current-oauth-subject") {
          throw new HelixAgentAccountLinkError(
            400,
            "invalid_request",
            "Explicit OAuth account-link confirmation is required.",
          );
        }
        const session = await requireActiveSession(req, resolveSession);
        let verified;
        try {
          verified = await verifier.verify(bearerToken(req));
        } catch {
          throw new HelixAgentAccountLinkError(
            401,
            "invalid_request",
            "The OAuth identity could not be verified.",
          );
        }
        const issuer = verifier.authorizationServer();
        const audience = verifier.audience();
        const providerAlias = verifier.providerAlias();
        if (verified.issuer !== issuer) {
          throw new HelixAgentAccountLinkError(
            401,
            "invalid_request",
            "The OAuth identity does not match this Helix provider.",
          );
        }
        const intent = await linkStore.createLinkIntent({
          session,
          expectedIssuer: issuer,
          expectedAudience: audience,
          expectedProvider: providerAlias,
          ttlSeconds: 60,
        });
        const receipt = await linkStore.completeLinkIntent({
          session,
          state: intent.state,
          identity: {
            issuer: verified.issuer,
            audience,
            tenantId: verified.tenantId,
            providerAlias,
            subject: verified.subject,
          },
        });
        setPrivateResponseHeaders(res);
        res.status(200).json(receipt);
      } catch (error) {
        safeError(res, error);
      }
    },
  );

  router.get(
    "/session/agent-bindings",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const session = await requireActiveSession(req, resolveSession);
        const result = await store.listBindings({ session });
        setPrivateResponseHeaders(res);
        res.status(200).json(result);
      } catch (error) {
        safeError(res, error);
      }
    },
  );

  router.delete(
    "/session/agent-bindings/:bindingRef",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const session = await requireActiveSession(req, resolveSession);
        const result = await store.revokeBinding({
          session,
          bindingRef: req.params.bindingRef,
          reason: "user_revoked_via_account_session",
        });
        setPrivateResponseHeaders(res);
        res.status(200).json(result);
      } catch (error) {
        safeError(res, error);
      }
    },
  );

  return router;
};
