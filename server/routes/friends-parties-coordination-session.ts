import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import {
  HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE,
  HELIX_FRIENDS_PARTIES_COORDINATION_SESSION_SCHEMA,
  type HelixFriendsPartiesCoordinationSession,
} from "@shared/helix-friends-voice-party";
import {
  DefaultHelixAgentAccessTokenVerifier,
  type HelixAgentAccessTokenVerifier,
} from "../auth/helix-agent-principal";
import { boundAccountSessionExpiry, signInWebAccountSession } from
  "../services/helix-account/account-session-store";
import { setHelixSessionCookie } from
  "../services/helix-account/session-cookie";

type SignIn = typeof signInWebAccountSession;

const normalized = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const privateHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
};

const response = (
  patch: Partial<HelixFriendsPartiesCoordinationSession>,
): HelixFriendsPartiesCoordinationSession => ({
  schema: HELIX_FRIENDS_PARTIES_COORDINATION_SESSION_SCHEMA,
  ok: false,
  error: "coordination_session_failed",
  message: "Friends & Parties coordination is unavailable.",
  expires_at: null,
  profile_ref: null,
  bearer_included: false,
  session_cookie_included: false,
  model_visible: false,
  debug_exportable: false,
  persistable: false,
  answer_authority: false,
  ...patch,
});

const bearer = (req: Request): string | null => {
  const match = (req.get("authorization") ?? "").match(/^Bearer ([^\s]+)$/u);
  return match?.[1] ?? null;
};

const profileRef = (profileId: string): string =>
  `social_profile:sha256:${crypto.createHash("sha256").update(profileId).digest("hex").slice(0, 24)}`;

export const createFriendsPartiesCoordinationSessionRouter = (dependencies: {
  verifier?: HelixAgentAccessTokenVerifier;
  signIn?: SignIn;
  boundSessionExpiry?: typeof boundAccountSessionExpiry;
  nativeClientId?: string;
} = {}): Router => {
  const router = Router();
  router.post(
    "/session/friends-parties-coordination/exchange",
    async (req: Request, res: Response): Promise<void> => {
      privateHeaders(res);
      const token = bearer(req);
      if (!token) {
        res.status(401).json(response({
          error: "coordination_auth_required",
          message: "A verified native coordination authorization is required.",
        }));
        return;
      }
      try {
        const verifier = dependencies.verifier ??
          new DefaultHelixAgentAccessTokenVerifier();
        const verified = await verifier.verify(token);
        if (!verified.scopes.has(HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE)) {
          res.status(403).json(response({
            error: "coordination_scope_required",
            message: "The Friends & Parties coordination scope is required.",
          }));
          return;
        }
        const expectedClient = normalized(
          dependencies.nativeClientId ?? process.env.HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID,
        );
        const tokenClient = normalized(verified.claims.azp) ||
          normalized(verified.claims.client_id);
        if (!expectedClient || tokenClient !== expectedClient) {
          res.status(403).json(response({
            error: "coordination_native_client_required",
            message: "The exact CasimirBot native OAuth client is required.",
          }));
          return;
        }
        const receipt = await (dependencies.signIn ?? signInWebAccountSession)({
          provider: "auth0",
          provider_subject: verified.subject,
          display_name: normalized(verified.claims.name) ||
            normalized(verified.claims.nickname) || "Auth0 user",
          email: verified.claims.email_verified === true
            ? normalized(verified.claims.email) || null
            : null,
          picture_url: normalized(verified.claims.picture) || null,
        });
        if (!receipt.ok || !receipt.session) {
          res.status(503).json(response({}));
          return;
        }
        const tokenExpiresAtMs = Date.parse(verified.expiresAt);
        const sessionExpiresAtMs = receipt.session.expires_at
          ? Date.parse(receipt.session.expires_at)
          : tokenExpiresAtMs;
        const expiresAtMs = Math.min(tokenExpiresAtMs, sessionExpiresAtMs);
        if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
          res.status(401).json(response({
            error: "coordination_auth_required",
            message: "The native coordination authorization has expired.",
          }));
          return;
        }
        await (dependencies.boundSessionExpiry ?? boundAccountSessionExpiry)({
          sessionId: receipt.session.session_id,
          expiresAt: new Date(expiresAtMs).toISOString(),
        });
        setHelixSessionCookie(res, receipt.session.session_id, {
          maxAgeMs: Math.max(1, expiresAtMs - Date.now()),
        });
        res.status(200).json(response({
          ok: true,
          error: null,
          message: "Friends & Parties domain coordination session established.",
          expires_at: new Date(expiresAtMs).toISOString(),
          profile_ref: profileRef(receipt.session.profile.profile_id),
        }));
      } catch {
        res.status(401).json(response({
          error: "coordination_auth_required",
          message: "The native coordination authorization could not be verified.",
        }));
      }
    },
  );
  return router;
};

export const friendsPartiesCoordinationSessionRouter =
  createFriendsPartiesCoordinationSessionRouter();
