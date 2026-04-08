import fs from "node:fs";
import path from "node:path";
import express, { type Response } from "express";
import { z } from "zod";
import {
  buildObservableUniverseAccordionEtaProjection,
} from "@shared/observable-universe-accordion-projections";
import {
  OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY,
  type ObservableUniverseSupportedEtaMode,
} from "@shared/observable-universe-accordion-projections-constants";
import {
  buildObservableUniverseAccordionEtaSurface,
} from "@shared/observable-universe-accordion-surfaces";
import { buildRelativisticMapProjection } from "@shared/relativistic-map-projections";
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
    etaMode: z.enum(["proper_time", "coordinate_time"]).optional(),
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

const readJsonArtifact = (relativePath: string): unknown | null => {
  try {
    const resolvedPath = path.resolve(process.cwd(), relativePath);
    return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  } catch {
    return null;
  }
};

const loadObservableUniverseAccordionEtaProjection = () => {
  const policy = OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY;
  const boundaryArtifact = readJsonArtifact(policy.sourceBoundaryArtifactPath);
  const defaultMissionTimeComparison = readJsonArtifact(
    policy.sourceDefaultMissionTimeComparisonArtifactPath,
  );
  const supportedFloorMissionTimeComparison = readJsonArtifact(
    policy.sourceSupportedFloorMissionTimeComparisonArtifactPath,
  );
  const supportedBandCeilingReferenceMissionTimeComparison = readJsonArtifact(
    policy.sourceSupportedBandCeilingReferenceArtifactPath,
  );
  const evidenceFloorMissionTimeComparison = readJsonArtifact(
    policy.sourceEvidenceFloorMissionTimeComparisonArtifactPath,
  );

  if (
    boundaryArtifact == null ||
    defaultMissionTimeComparison == null ||
    supportedFloorMissionTimeComparison == null ||
    supportedBandCeilingReferenceMissionTimeComparison == null ||
    evidenceFloorMissionTimeComparison == null
  ) {
    return null;
  }

  return buildObservableUniverseAccordionEtaProjection({
    boundaryArtifact,
    defaultMissionTimeComparison,
    supportedFloorMissionTimeComparison,
    supportedBandCeilingReferenceMissionTimeComparison,
    evidenceFloorMissionTimeComparison,
  });
};

helixRelativisticMapRouter.post("/project", (req, res) => {
  setCors(res);
  const parsed = ProjectSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid-request", issues: parsed.error.issues });
    return;
  }

  if (
    parsed.data.sourceModel === "warp_worldline_route_time" &&
    parsed.data.projectionKind === "sun_centered_accessibility"
  ) {
    const projection = buildObservableUniverseAccordionEtaSurface({
      contract: loadObservableUniverseAccordionEtaProjection(),
      catalog: parsed.data.catalog,
      estimateKind:
        (parsed.data.etaMode as ObservableUniverseSupportedEtaMode | undefined) ??
        "proper_time",
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: projection.status === "computed",
      projection,
    });
    return;
  }

  const pipelineState = getGlobalPipelineState() as Record<string, unknown> | null;
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
