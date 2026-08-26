import { Router, type Request, type Response } from "express";
import {
  Auth0WebAccountSessionError,
  auth0WebAccountSessionController,
  type Auth0WebAccountSessionController,
} from "../services/helix-account/auth0-web-account-session";
import { setHelixSessionCookie } from "../services/helix-account/session-cookie";

export type Auth0WebAuthRouterOptions = {
  controller?: Pick<Auth0WebAccountSessionController, "start" | "complete">;
};

const failureRedirect = (code: string): string => {
  const target = new URL(
    "/desktop?panels=account-session&focus=account-session",
    "http://127.0.0.1",
  );
  target.searchParams.set("auth0_account", code);
  return `${target.pathname}${target.search}`;
};

export const createAuth0WebAuthRouter = (
  options: Auth0WebAuthRouterOptions = {},
): Router => {
  const router = Router();
  const controller = options.controller ?? auth0WebAccountSessionController;

  router.get("/auth0/start", (req: Request, res: Response): void => {
    try {
      const started = controller.start(req.query.return_to);
      res.setHeader("Cache-Control", "no-store");
      res.redirect(302, started.authorizationUrl);
    } catch (error) {
      const code =
        error instanceof Auth0WebAccountSessionError
          ? error.code
          : "auth0_not_configured";
      res.redirect(302, failureRedirect(code));
    }
  });

  router.get("/auth0/callback", async (req: Request, res: Response): Promise<void> => {
    try {
      const completed = await controller.complete(req.query);
      setHelixSessionCookie(res, completed.receipt.session!.session_id);
      res.setHeader("Cache-Control", "no-store");
      const target = new URL(completed.returnTo, "http://127.0.0.1");
      target.searchParams.set("auth0_account", "linked");
      res.redirect(302, `${target.pathname}${target.search}${target.hash}`);
    } catch (error) {
      const code =
        error instanceof Auth0WebAccountSessionError
          ? error.code
          : "session_creation_failed";
      res.redirect(302, failureRedirect(code));
    }
  });

  return router;
};

export const auth0WebAuthRouter = createAuth0WebAuthRouter();
