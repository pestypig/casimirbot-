import { Router } from "express";
import type { Request, Response } from "express";
import { buildNhm2TheoryBadgeGraphV1 } from "../../../shared/theory/nhm2-theory-badges";
import { validateTheoryBadgeGraphV1 } from "../../../shared/contracts/theory-badge-graph.v1";

const helixTheoryRouter = Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

helixTheoryRouter.options("/graph", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixTheoryRouter.get("/graph", (_req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const issues = validateTheoryBadgeGraphV1(graph);

    if (issues.length > 0) {
      return res.status(500).json({
        error: "theory-badge-graph-invalid",
        issues,
      });
    }

    return res.json(graph);
  } catch (err) {
    return res.status(500).json({
      error: "theory-badge-graph-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export { helixTheoryRouter };
