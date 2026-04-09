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
import type {
  AstronomyProvenanceClass,
  AstronomyReferenceFrameId,
  AstronomyTimeScale,
} from "@shared/contracts/astronomy-frame.v1";
import { getGlobalPipelineState } from "../../energy-pipeline";
import { buildAccordionRenderCatalogEntry } from "../../modules/astronomy/render/accordion-transform";
import {
  propagateAstronomyCatalogEntry,
  type AstronomyCatalogInput,
} from "../../modules/astronomy/epoch-propagation";
import { buildAstronomyFrameLayer } from "../../modules/astronomy/reference-frames";
import { summarizeAstronomyProvenance } from "../../modules/astronomy/provenance";

const helixRelativisticMapRouter = express.Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const Vec3Schema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

const AstrometrySchema = z.object({
  ra_deg: z.number().finite(),
  dec_deg: z.number().finite(),
  parallax_mas: z.number().finite().nullable().optional(),
  proper_motion_ra_masyr: z.number().finite().nullable().optional(),
  proper_motion_dec_masyr: z.number().finite().nullable().optional(),
  radial_velocity_kms: z.number().finite().nullable().optional(),
  covariance: z.record(z.number().finite()).nullable().optional(),
});

const CatalogEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  position_m: Vec3Schema.optional(),
  frame_id: z
    .enum(["ICRS", "ICRF3_radio", "Gaia_CRF3_optical", "BCRS_TCB_epoch", "sol_centered_accordion_render"] satisfies [
      AstronomyReferenceFrameId,
      ...AstronomyReferenceFrameId[],
    ])
    .optional(),
  frame_realization: z.string().optional().nullable(),
  reference_epoch_tcb_jy: z.number().finite().optional().nullable(),
  time_scale: z.enum(["TCB"] satisfies [AstronomyTimeScale, ...AstronomyTimeScale[]]).optional(),
  provenance_class: z
    .enum(["observed", "synthetic_truth", "synthetic_observed", "inferred"] satisfies [
      AstronomyProvenanceClass,
      ...AstronomyProvenanceClass[],
    ])
    .optional(),
  astrometry: AstrometrySchema.optional(),
}).superRefine((value, ctx) => {
  if (!value.position_m && !value.astrometry) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "position_m or astrometry is required",
      path: ["position_m"],
    });
  }
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
    renderEpoch_tcb_jy: z.number().finite().optional(),
    includeHiddenAnchorsDebug: z.boolean().optional(),
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

const buildAstronomyCatalogForAccordionRender = (args: {
  catalog: Array<z.infer<typeof CatalogEntrySchema>>;
  renderEpoch_tcb_jy?: number;
}) => {
  const renderEpoch = args.renderEpoch_tcb_jy ?? 2016.0;
  const propagated = args.catalog.map((entry) => {
    const input: AstronomyCatalogInput = {
      id: entry.id,
      label: entry.label,
      position_m: entry.position_m,
      frame_id: entry.frame_id,
      frame_realization: entry.frame_realization ?? undefined,
      reference_epoch_tcb_jy: entry.reference_epoch_tcb_jy ?? undefined,
      time_scale: entry.time_scale,
      provenance_class: entry.provenance_class,
      astrometry: entry.astrometry,
    };
    return propagateAstronomyCatalogEntry(input, renderEpoch);
  });
  const visibleCatalog = propagated.map((entry) => buildAccordionRenderCatalogEntry(entry));
  const frameLayer = buildAstronomyFrameLayer({
    catalog: propagated,
    propagatedIds: propagated.map((entry) => entry.id),
    canonicalFrameId: "ICRS",
  });
  return {
    renderEpoch,
    propagated,
    visibleCatalog,
    frameLayer,
    propagationApplied: propagated.some((entry) => entry.propagation_applied),
    provenanceSummary: summarizeAstronomyProvenance(propagated.map((entry) => entry.provenance_class)),
  };
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
    const astronomyCatalog = buildAstronomyCatalogForAccordionRender({
      catalog: parsed.data.catalog,
      renderEpoch_tcb_jy: parsed.data.renderEpoch_tcb_jy,
    });
    const projection = buildObservableUniverseAccordionEtaSurface({
      contract: loadObservableUniverseAccordionEtaProjection(),
      catalog: astronomyCatalog.visibleCatalog,
      estimateKind:
        (parsed.data.etaMode as ObservableUniverseSupportedEtaMode | undefined) ??
        "proper_time",
      canonicalFrameId: "ICRS",
      canonicalFrameRealization: "Gaia_CRF3",
      renderEpoch_tcb_jy: astronomyCatalog.renderEpoch,
      propagationApplied: astronomyCatalog.propagationApplied,
      hiddenAnchorCount: astronomyCatalog.frameLayer.hidden_anchor_count,
      hiddenAnchorsUsed: true,
      frameLayer: astronomyCatalog.frameLayer,
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
