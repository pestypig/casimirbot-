import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { signInWebAccountSession, signOutAccountSession } from "../services/helix-account/account-session-store";
import {
  clearHelixSessionCookie,
  readCookie,
  readHelixSessionCookie,
  setHelixSessionCookie,
} from "../services/helix-account/session-cookie";

type GooglePayload = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

type GoogleVerifier = (credential: string, audience: string) => Promise<GooglePayload | null>;

export type GoogleAuthRouterOptions = {
  clientId?: string;
  verifyIdToken?: GoogleVerifier;
};

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function defaultGoogleVerifier(): GoogleVerifier {
  const client = new OAuth2Client();
  return async (credential, audience) => {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience,
    });
    return ticket.getPayload() ?? null;
  };
}

export function createGoogleAuthRouter(options: GoogleAuthRouterOptions = {}): Router {
  const router = Router();
  const verifyIdToken = options.verifyIdToken ?? defaultGoogleVerifier();

  router.post("/google", async (req, res) => {
    const clientId = asString(options.clientId ?? process.env.GOOGLE_CLIENT_ID);
    if (!clientId) {
      return res.status(500).json({
        ok: false,
        error: "google_client_id_missing",
        message: "GOOGLE_CLIENT_ID is not configured.",
      });
    }

    const credential = asString(req.body?.credential);
    if (!credential) {
      return res.status(400).json({
        ok: false,
        error: "missing_google_credential",
        message: "Google credential is required.",
      });
    }

    const bodyCsrf = asString(req.body?.g_csrf_token);
    const cookieCsrf = asString(readCookie(req.headers.cookie, "g_csrf_token"));
    if (!bodyCsrf || !cookieCsrf || bodyCsrf !== cookieCsrf) {
      return res.status(400).json({
        ok: false,
        error: "google_csrf_failed",
        message: "Google sign-in CSRF verification failed.",
      });
    }

    try {
      const payload = await verifyIdToken(credential, clientId);
      if (!payload?.sub) {
        return res.status(401).json({
          ok: false,
          error: "invalid_google_identity",
          message: "Google did not provide a stable subject.",
        });
      }

      const receipt = await signInWebAccountSession({
        provider: "google",
        provider_subject: payload.sub,
        display_name: payload.name ?? payload.email ?? null,
        email: payload.email ?? null,
        picture_url: payload.picture ?? null,
      });
      if (receipt.session) {
        setHelixSessionCookie(res, receipt.session.session_id);
      }
      return res.status(receipt.ok ? 200 : 400).json(receipt);
    } catch {
      return res.status(401).json({
        ok: false,
        error: "google_token_verification_failed",
        message: "Google token verification failed.",
      });
    }
  });

  router.post("/google/sign-out", async (req, res) => {
    clearHelixSessionCookie(res);
    res.json(await signOutAccountSession(readHelixSessionCookie(req.headers.cookie)));
  });

  return router;
}

export const googleAuthRouter = createGoogleAuthRouter();
