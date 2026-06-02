import { Router } from "express";
import type { Request, Response } from "express";
import { validateStagePlayBadgeGraphV1 } from "../../../shared/contracts/stage-play-badge-graph.v1";
import { buildStagePlayGraphFromWorld } from "../../services/stage-play/stage-play-badge-graph-builder";

const helixStagePlayRouter = Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const readQueryString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

helixStagePlayRouter.options("/graph", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.get("/graph", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const graph = buildStagePlayGraphFromWorld({
      threadId: readQueryString(req.query.threadId) ?? "stage-play-panel",
      roomId: readQueryString(req.query.roomId),
      environmentId: readQueryString(req.query.environmentId),
      objective: readQueryString(req.query.objective),
    });
    const issues = validateStagePlayBadgeGraphV1(graph);

    if (issues.length > 0) {
      return res.status(500).json({
        error: "stage-play-badge-graph-invalid",
        issues,
      });
    }

    return res.json(graph);
  } catch (err) {
    return res.status(500).json({
      error: "stage-play-badge-graph-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export { helixStagePlayRouter };
