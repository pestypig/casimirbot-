import express, { type Response } from "express";
import { z } from "zod";
import { buildRelativisticMapProjection } from "@shared/relativistic-map-projections";
import { buildObservableUniverseAccordionProjection } from "@shared/observable-universe-accordion-projections";
import { getGlobalPipelineState } from "../../energy-pipeline";

const helixRelativisticMapRouter = express.Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const Vec3Schema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

const CatalogEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  position_m: Vec3Schema,
});

const ControlSchema = z.object({
  properAcceleration_m_s2: z.number().positive(),
  currentProperTime_s: z.number().nonnegative().optional(),
  direction: Vec3Schema.optional(),
  shipPosition_m: Vec3Schema.optional(),
});

const ProjectSchema = z
  .object({
    projectionKind: z.enum(["instantaneous_ship_view", "sun_centered_accessibility"]),
    sourceModel: z
      .enum(["flat_sr_flip_burn_control", "warp_worldline_route_time", "warp_worldline_local_comoving"])
      .default("flat_sr_flip_burn_control"),
    catalog: z.array(CatalogEntrySchema).min(1),
    control: ControlSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceModel === "flat_sr_flip_burn_control" && !value.control) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "control is required when sourceModel=flat_sr_flip_burn_control",
        path: ["control"],
      });
    }
  });

const AccordionProjectSchema = z
  .object({
    projectionKind: z.literal("observable_universe_accordion"),
    accordionMode: z.enum(["raw_distance", "sr_accessibility", "nhm2_accessibility"]),
    catalog: z.array(CatalogEntrySchema).min(1),
    frame: z.literal("heliocentric-icrs").optional(),
    control: ControlSchema.pick({ properAcceleration_m_s2: true }).optional(),
    selectedLaneId: z.string().min(1).optional(),
    selectedProfileId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accordionMode === "sr_accessibility" && !value.control) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "control is required when accordionMode=sr_accessibility",
        path: ["control"],
      });
    }
  });

const AnyProjectSchema = z.union([ProjectSchema, AccordionProjectSchema]);

helixRelativisticMapRouter.options("/project", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixRelativisticMapRouter.post("/project", (req, res) => {
  setCors(res);
  const parsed = AnyProjectSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid-request", issues: parsed.error.issues });
    return;
  }

  const pipelineState = getGlobalPipelineState() as Record<string, unknown> | null;
  if (parsed.data.projectionKind === "observable_universe_accordion") {
    const projection = buildObservableUniverseAccordionProjection({
      ...parsed.data,
      frame: parsed.data.frame ?? "heliocentric-icrs",
      warpCatalogEtaProjection: ((pipelineState as any)?.warpCatalogEtaProjection ?? null),
      warpMissionTimeEstimator: ((pipelineState as any)?.warpMissionTimeEstimator ?? null),
      warpMissionTimeComparison: ((pipelineState as any)?.warpMissionTimeComparison ?? null),
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: projection.status === "computed",
      projection,
    });
    return;
  }

  const warpWorldline =
    parsed.data.sourceModel === "flat_sr_flip_burn_control"
      ? undefined
      : ((pipelineState as any)?.warpWorldline ?? null);
  const warpRouteTimeWorldline =
    parsed.data.sourceModel === "warp_worldline_route_time"
      ? ((pipelineState as any)?.warpRouteTimeWorldline ?? null)
      : undefined;
  const warpMissionTimeEstimator =
    parsed.data.sourceModel === "warp_worldline_route_time"
      ? ((pipelineState as any)?.warpMissionTimeEstimator ?? null)
      : undefined;
  const warpMissionTimeComparison =
    parsed.data.sourceModel === "warp_worldline_route_time"
      ? ((pipelineState as any)?.warpMissionTimeComparison ?? null)
      : undefined;
  const projection = buildRelativisticMapProjection({
    ...parsed.data,
    warpWorldline,
    warpRouteTimeWorldline,
    warpMissionTimeEstimator,
    warpMissionTimeComparison,
  });
  res.setHeader("Cache-Control", "no-store");
  res.json({
    ok: projection.status === "computed",
    projection,
  });
});

export { helixRelativisticMapRouter };
