import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  buildStarSimAccordionCosmologyContext,
  starSimAccordionCosmologyContextSchema,
} from "./starsim-accordion-cosmology-context";
import {
  computeStarSimGalacticRotationControls,
  starSimGalacticRotationControlResultSchema,
  starSimGalacticRotationControlModelSchema,
} from "./starsim-galactic-rotation-controls";
import {
  allStarSimGalacticDynamicsClaimIds,
  citationsForStarSimGalacticDynamicsClaims,
  sourceRolesForStarSimGalacticDynamicsClaims,
  uncertaintyNotesForStarSimGalacticDynamicsClaims,
} from "./starsim-galactic-dynamics-claims";

const fusionChannelSchema = z.enum([
  "pp_chain",
  "cno_cycle",
  "triple_alpha",
  "advanced_burning",
  "none",
  "compact_object_not_fusing",
]);

const fusionZoneModeSchema = z.enum([
  "core_fusion",
  "shell_fusion",
  "distributed_convective_core",
  "compact_object_not_applicable",
  "unknown",
]);

export const starSimAccordionStarNodeSchema = z.object({
  objectId: z.string().min(1),
  coordinates: z.object({
    ra_deg: z.number().optional(),
    dec_deg: z.number().optional(),
    parallax_mas: z.number().optional(),
    distance_pc: z.number().nonnegative().optional(),
    position_pc: z.tuple([z.number(), z.number(), z.number()]).optional(),
    properMotion_masyr: z.tuple([z.number(), z.number()]).optional(),
    radialVelocity_km_s: z.number().optional(),
    velocity_km_s: z.tuple([z.number(), z.number(), z.number()]).optional(),
  }),
  stellarClassification: z.object({
    spectralType: z.string().optional(),
    luminosityClass: z.string().optional(),
    objectClass: z.enum([
      "main_sequence",
      "red_dwarf",
      "red_giant",
      "white_dwarf",
      "neutron_star",
      "brown_dwarf",
      "unknown",
    ]),
  }),
  fusionPrior: z.object({
    dominantFusionChannel: fusionChannelSchema,
    fusionZoneMode: fusionZoneModeSchema.optional(),
    quantumMicrophysicsRole: z.enum([
      "microphysical_rate_law",
      "degenerate_compact_object_quantum_fluid",
      "not_applicable",
    ]),
  }),
  qstAnnotation: z.object({
    qstRole: z.literal("astrophysical_population_prior"),
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveat: z.literal("stellar_node_is_not_direct_er_epr_evidence"),
  }),
});

export type StarSimAccordionStarNode = z.infer<typeof starSimAccordionStarNodeSchema>;

export const starSimAccordionGalacticNullPlanSchema = z.object({
  schemaVersion: z.literal("starsim-accordion-galactic-null-plan.v1"),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  cosmology: z.object({
    redshift: z.number().nonnegative().optional(),
    scaleFactor: z.number().positive().optional(),
    cosmicTime_Gyr: z.number().nonnegative().optional(),
    lookbackTime_Gyr: z.number().nonnegative().optional(),
    comovingDistance_Mpc: z.number().nonnegative().optional(),
    properDistance_Mpc: z.number().nonnegative().optional(),
    luminosityDistance_Mpc: z.number().nonnegative().optional(),
    angularDiameterDistance_Mpc: z.number().nonnegative().optional(),
    systemKind: z.enum(["large_scale", "bound_galaxy", "stellar_core", "not_applicable"]).optional(),
  }),
  starNodes: z.array(starSimAccordionStarNodeSchema.omit({ qstAnnotation: true })),
  rotation: z.object({
    galaxyId: z.string().min(1),
    points: z.array(
      z.object({
        radius_kpc: z.number().nonnegative(),
        observedVelocity_km_s: z.number().nonnegative().optional(),
        baryonicVelocity_km_s: z.number().nonnegative().optional(),
        modelVelocities: z.record(z.string(), z.number()).optional(),
      }),
    ).min(1),
    models: z.array(starSimGalacticRotationControlModelSchema).optional(),
    passRmsResidual_km_s: z.number().nonnegative().optional(),
    warnRmsResidual_km_s: z.number().nonnegative().optional(),
    interpretationRequest: z.enum(["null_model_only", "direct_er_epr"]).optional(),
  }).optional(),
  qstBoundary: z.object({
    qstRole: z.literal("astrophysical_population_prior"),
    edgeType: z.literal("cosmological_structure_context"),
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    erDensityProxy: z.number().nonnegative().optional(),
  }),
});

export type StarSimAccordionGalacticNullPlan = z.infer<
  typeof starSimAccordionGalacticNullPlanSchema
>;

export const starSimAccordionGalacticNullEvaluationSchema = z.object({
  schemaVersion: z.literal("starsim-accordion-galactic-null-evaluation.v1"),
  runId: z.string(),
  createdAt: z.string().datetime(),
  accordionContext: starSimAccordionCosmologyContextSchema,
  starPopulation: z.object({
    nodes: z.array(starSimAccordionStarNodeSchema),
    populationSummary: z.object({
      nodeCount: z.number().int().nonnegative(),
      spectralTypeHistogram: z.record(z.string(), z.number().int().nonnegative()),
      fusionChannelHistogram: z.record(z.string(), z.number().int().nonnegative()),
      localDensityContrast: z.number().optional(),
      velocityDispersion_km_s: z.number().nonnegative().optional(),
      clusteringEntropy_nats: z.number().nonnegative().optional(),
      streamCoherence: z.number().min(0).max(1).optional(),
    }),
  }),
  galacticDynamics: z.object({
    galaxyId: z.string().optional(),
    controls: z.array(starSimGalacticRotationControlResultSchema),
    preferredInterpretation: z.literal("none"),
    reason: z.literal("null_model_layer_does_not_select_physics_winner"),
  }),
  qstBoundary: z.object({
    qstRole: z.literal("astrophysical_population_prior"),
    edgeType: z.literal("cosmological_structure_context"),
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    erDensityProxy: z.number().nonnegative().optional(),
    caveat: z.literal("erDensityProxy_is_not_wormhole_density"),
  }),
  evidence: z.object({
    stage: z.literal("STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1"),
    claimTier: z.literal("Stage1_astrophysical_null_context"),
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    sourceRoles: z.record(z.string(), z.string()),
    uncertaintyNotes: z.array(z.string()).min(1),
  }),
});

export type StarSimAccordionGalacticNullEvaluation = z.infer<
  typeof starSimAccordionGalacticNullEvaluationSchema
>;

export function runStarSimAccordionGalacticNullModel(
  rawPlan: StarSimAccordionGalacticNullPlan,
): StarSimAccordionGalacticNullEvaluation {
  const plan = starSimAccordionGalacticNullPlanSchema.parse(rawPlan);
  if (plan.rotation?.interpretationRequest === "direct_er_epr") {
    throw new Error("star-map and rotation residuals cannot be direct ER=EPR evidence");
  }
  const nodes = plan.starNodes.map((node) =>
    starSimAccordionStarNodeSchema.parse({
      ...node,
      qstAnnotation: {
        qstRole: "astrophysical_population_prior",
        spacetimeCL: "proxy_only",
        mayPromoteToCL4: false,
        caveat: "stellar_node_is_not_direct_er_epr_evidence",
      },
    }),
  );
  const controls = plan.rotation
    ? computeStarSimGalacticRotationControls({
        galaxyId: plan.rotation.galaxyId,
        points: plan.rotation.points,
        models: plan.rotation.models,
        passRmsResidual_km_s: plan.rotation.passRmsResidual_km_s,
        warnRmsResidual_km_s: plan.rotation.warnRmsResidual_km_s,
        interpretationRequest: "null_model_only",
      })
    : [];
  const claimIds = allStarSimGalacticDynamicsClaimIds();
  return starSimAccordionGalacticNullEvaluationSchema.parse({
    schemaVersion: "starsim-accordion-galactic-null-evaluation.v1",
    runId: `starsim-accordion-galactic-null:${randomUUID()}`,
    createdAt: new Date().toISOString(),
    accordionContext: buildStarSimAccordionCosmologyContext(plan.cosmology),
    starPopulation: {
      nodes,
      populationSummary: summarizePopulation(nodes),
    },
    galacticDynamics: {
      galaxyId: plan.rotation?.galaxyId,
      controls,
      preferredInterpretation: "none",
      reason: "null_model_layer_does_not_select_physics_winner",
    },
    qstBoundary: {
      qstRole: "astrophysical_population_prior",
      edgeType: "cosmological_structure_context",
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      erDensityProxy: plan.qstBoundary.erDensityProxy,
      caveat: "erDensityProxy_is_not_wormhole_density",
    },
    evidence: {
      stage: "STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1",
      claimTier: "Stage1_astrophysical_null_context",
      claimIds,
      citations: citationsForStarSimGalacticDynamicsClaims(claimIds),
      sourceRoles: sourceRolesForStarSimGalacticDynamicsClaims(claimIds),
      uncertaintyNotes: uncertaintyNotesForStarSimGalacticDynamicsClaims(claimIds),
    },
  });
}

function summarizePopulation(nodes: StarSimAccordionStarNode[]) {
  const spectralTypeHistogram = histogram(
    nodes.map((node) => node.stellarClassification.spectralType ?? "unknown"),
  );
  const fusionChannelHistogram = histogram(
    nodes.map((node) => node.fusionPrior.dominantFusionChannel),
  );
  const velocities = nodes
    .map((node) => node.coordinates.velocity_km_s)
    .filter((value): value is [number, number, number] => value !== undefined);
  return {
    nodeCount: nodes.length,
    spectralTypeHistogram,
    fusionChannelHistogram,
    localDensityContrast: nodes.length > 0 ? nodes.length / Math.max(1, uniqueSectors(nodes)) : undefined,
    velocityDispersion_km_s: velocities.length > 1 ? velocityDispersion(velocities) : undefined,
    clusteringEntropy_nats: entropy(Object.values(fusionChannelHistogram)),
    streamCoherence: velocities.length > 1 ? Math.max(0, Math.min(1, 1 / (1 + velocityDispersion(velocities) / 50))) : undefined,
  };
}

function histogram(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function entropy(counts: number[]): number {
  const total = counts.reduce((acc, value) => acc + value, 0);
  if (total === 0) return 0;
  return counts.reduce((acc, count) => {
    const p = count / total;
    return p > 0 ? acc - p * Math.log(p) : acc;
  }, 0);
}

function velocityDispersion(values: [number, number, number][]): number {
  const mean = values.reduce<[number, number, number]>(
    (acc, value) => [acc[0] + value[0], acc[1] + value[1], acc[2] + value[2]],
    [0, 0, 0],
  ).map((value) => value / values.length) as [number, number, number];
  const variance =
    values.reduce((acc, value) => {
      const dx = value[0] - mean[0];
      const dy = value[1] - mean[1];
      const dz = value[2] - mean[2];
      return acc + dx ** 2 + dy ** 2 + dz ** 2;
    }, 0) / values.length;
  return Math.sqrt(variance);
}

function uniqueSectors(nodes: StarSimAccordionStarNode[]): number {
  const sectors = new Set(
    nodes.map((node) => {
      const pos = node.coordinates.position_pc;
      if (!pos) return "unknown";
      return pos.map((component) => Math.sign(component)).join(":");
    }),
  );
  return sectors.size;
}
