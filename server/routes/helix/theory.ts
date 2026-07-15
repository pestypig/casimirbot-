import { Router } from "express";
import type { Request, Response } from "express";
import { buildNhm2TheoryBadgeGraphV1 } from "../../../shared/theory/nhm2-theory-badges";
import { validateTheoryBadgeGraphV1 } from "../../../shared/contracts/theory-badge-graph.v1";
import { isTheoryCompoundRunV1 } from "../../../shared/contracts/theory-compound-run.v1";
import { buildArtifactBackedCompoundTheoryRun } from "../../services/theory/artifact-backed-compound-run";
import { helixTheoryRuntimeRouter } from "./theory-runtime";

const helixTheoryRouter = Router();

helixTheoryRouter.use("/runtime-jobs", helixTheoryRuntimeRouter);

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

helixTheoryRouter.options("/graph", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixTheoryRouter.options("/compound-run", (_req, res) => {
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

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const asMode = (value: unknown) =>
  value === "dependency_path" || value === "locator_matches" || value === "selected_badges"
    ? value
    : "dependency_path";

helixTheoryRouter.post("/compound-run", async (req: Request, res: Response) => {
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

    const body = typeof req.body === "object" && req.body !== null ? req.body as Record<string, unknown> : {};
    const badgeIds = asStringArray(body.badgeIds ?? body.badge_ids);
    if (badgeIds.length === 0) {
      return res.status(400).json({
        error: "badge-ids-required",
      });
    }

    const run = await buildArtifactBackedCompoundTheoryRun({
      graph,
      badgeIds,
      mode: asMode(body.mode),
      source: body.source === "helix_ask" || body.source === "manual" || body.source === "workstation_action"
        ? body.source
        : "theory_badge_graph",
      includeScalar: body.includeScalar !== false && body.include_scalar !== false,
      includeRuntime: body.includeRuntime !== false && body.include_runtime !== false,
      includeEvidence: body.includeEvidence !== false && body.include_evidence !== false,
      includeBoundaries: body.includeBoundaries !== false && body.include_boundaries !== false,
      runQuick: body.runQuick === true || body.run_quick === true,
      projectRoot: typeof body.projectRoot === "string" ? body.projectRoot : undefined,
    });

    if (!isTheoryCompoundRunV1(run)) {
      return res.status(500).json({
        error: "theory-compound-run-invalid",
      });
    }

    return res.json({
      kind: "theory_compound_run",
      artifact_v1: run,
    });
  } catch (err) {
    return res.status(500).json({
      error: "theory-compound-run-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export { helixTheoryRouter };
