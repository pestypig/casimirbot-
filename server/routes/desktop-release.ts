import { Router, type Request, type Response } from "express";
import {
  resolveDesktopReleaseStatus,
  type DesktopReleaseEnvironment,
} from "../services/desktop-release";

type DesktopReleaseRouterDependencies = Readonly<{
  environment?: DesktopReleaseEnvironment;
}>;

export function createDesktopReleaseRouter(
  dependencies: DesktopReleaseRouterDependencies = {},
): Router {
  const router = Router();
  router.get("/desktop-release/latest", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "public, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.json(
      resolveDesktopReleaseStatus(dependencies.environment ?? process.env),
    );
  });
  return router;
}

export const desktopReleaseRouter = createDesktopReleaseRouter();

