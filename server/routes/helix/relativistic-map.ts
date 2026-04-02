import express, { type Response } from "express";
import { z } from "zod";
import { buildRelativisticMapProjection } from "@shared/relativistic-map-projections";

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

helixRelativisticMapRouter.options("/project", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixRelativisticMapRouter.post("/project", (req, res) => {
  setCors(res);
  const parsed = ProjectSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid-request", issues: parsed.error.issues });
    return;
  }

  const projection = buildRelativisticMapProjection(parsed.data);
  res.setHeader("Cache-Control", "no-store");
  res.json({
    ok: projection.status === "computed",
    projection,
  });
});

export { helixRelativisticMapRouter };
