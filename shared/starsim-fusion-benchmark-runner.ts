import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  STARSIM_FUSION_BENCHMARK_CLAIM_IDS,
  citationsForStarSimFusionBenchmarkClaims,
  uncertaintyNotesForStarSimFusionBenchmarkClaims,
  type StarSimFusionBenchmarkClaimId,
} from "./starsim-fusion-benchmark-claims";
import {
  parseStarSimFusionProfileImport,
  starSimFusionProfileSourceSchema,
  type StarSimFusionProfileImport,
} from "./starsim-fusion-profile-import";
import {
  validateStarSimFusionProfile,
  type StarSimFusionProfileValidation,
} from "./starsim-fusion-profile-validation";
import {
  computeStarSimFusionClosure,
  type StarSimFusionClosureSummary,
} from "./starsim-fusion-profile-closure";
import {
  summarizeStarSimFusionUncertainty,
  type StarSimFusionUncertaintySummary,
} from "./starsim-fusion-uncertainty";
import {
  determineStarSimFusionBenchmarkVerdict,
  type StarSimFusionBenchmarkVerdict,
} from "./starsim-fusion-benchmark-verdict";

export const starSimFusionBenchmarkPlanSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-benchmark-plan.v1"),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  benchmarkSet: z.enum([
    "solar_reference",
    "main_sequence_grid",
    "red_dwarf_grid",
    "red_giant_shell_grid",
    "high_mass_cno_grid",
    "compact_object_glitch_context",
    "mixed_fixture_pack",
  ]),
  profileRefs: z.array(
    z.object({
      objectId: z.string().min(1),
      profilePath: z.string().min(1),
      profileHash: z.string().optional(),
      source: starSimFusionProfileSourceSchema,
    }),
  ),
  thresholds: z.object({
    luminosityClosureRelErrMax: z.number().nonnegative(),
    r90DeltaMax: z.number().nonnegative().optional(),
    channelFractionAgreementMin: z.number().min(0).max(1).optional(),
    stage1ProxyAgreementMin: z.number().min(0).max(1).optional(),
    uncertaintyCoverageMin: z.number().min(0).max(1).optional(),
  }),
  uncertaintyPolicy: z.object({
    mode: z.enum(["none", "interval", "monte_carlo_fixture"]),
    samples: z.number().int().positive().optional(),
    seed: z.number().int().optional(),
    perturb: z.enum([
      "observables_only",
      "profile_shells_only",
      "observables_and_profile_shells",
    ]),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    role: z.enum([
      "stellar_quantum_microphysics_prior",
      "cosmological_structure_prior",
      "not_direct_er_epr_evidence",
    ]),
  }),
});

export type StarSimFusionBenchmarkPlan = z.infer<
  typeof starSimFusionBenchmarkPlanSchema
>;

export type StarSimFusionBenchmarkBlocker = {
  blockerId:
    | "missing_profile_hash"
    | "missing_mesa_metadata"
    | "missing_uncertainty_model"
    | "luminosity_closure_failed"
    | "channel_fraction_mismatch"
    | "fusion_zone_mismatch"
    | "h_spectral_fit_overclaim"
    | "direct_er_epr_overclaim"
    | "qst_cl_promotion_attempt";
  objectId?: string;
  detail: string;
};

export const starSimFusionBenchmarkReportSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-benchmark-report.v1"),
  runId: z.string(),
  planId: z.string(),
  createdAt: z.string().datetime(),
  profileResults: z.array(z.any()),
  uncertaintySummaries: z.array(z.any()),
  closureSummaries: z.array(z.any()),
  aggregate: z.object({
    profileCount: z.number().int().nonnegative(),
    passedClosureCount: z.number().int().nonnegative(),
    failedClosureCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    channelAgreementRate: z.number().min(0).max(1).optional(),
    fusionZoneAgreementRate: z.number().min(0).max(1).optional(),
    uncertaintyCoverageRate: z.number().min(0).max(1).optional(),
    strongestVerdict: z.string(),
  }),
  blockers: z.array(z.any()),
  evidence: z.object({
    stage: z.literal("STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE"),
    claimTier: z.literal("Stage2_candidate_benchmark_support"),
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    sourceRoles: z.record(z.string(), z.string()),
    uncertaintyNotes: z.array(z.string()).min(1),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string()).min(1),
  }),
});

export type StarSimFusionBenchmarkReport = z.infer<
  typeof starSimFusionBenchmarkReportSchema
> & {
  profileResults: StarSimFusionProfileValidation[];
  uncertaintySummaries: StarSimFusionUncertaintySummary[];
  closureSummaries: StarSimFusionClosureSummary[];
  blockers: StarSimFusionBenchmarkBlocker[];
  aggregate: z.infer<typeof starSimFusionBenchmarkReportSchema>["aggregate"] & {
    strongestVerdict: StarSimFusionBenchmarkVerdict;
  };
};

export function runStarSimFusionBenchmarkPlan(
  rawPlan: StarSimFusionBenchmarkPlan,
): StarSimFusionBenchmarkReport {
  const plan = starSimFusionBenchmarkPlanSchema.parse(rawPlan);
  const profiles = plan.profileRefs.map((ref) => ({
    ref,
    profile: parseStarSimFusionProfileImport(JSON.parse(readFileSync(ref.profilePath, "utf8"))),
  }));
  const profileResults = profiles.map(({ profile }) => validateStarSimFusionProfile(profile));
  const closureSummaries = profiles.map(({ profile }, index) =>
    computeStarSimFusionClosure({
      luminosity_Lsun: profile.global.luminosity_Lsun,
      radius_Rsun: profile.global.radius_Rsun,
      mass_Msun: profile.global.mass_Msun,
      integratedNucLuminosity_Lsun:
        profileResults[index].integratedFusion.integratedNucLuminosity_Lsun,
      reproducibilityStatus: profile.provenance.reproducibilityStatus,
      mesaMetadata: profile.mesaMetadata,
    }),
  );
  const uncertaintySummaries = profiles.map(({ profile }) =>
    summarizeStarSimFusionUncertainty(profile, plan.uncertaintyPolicy),
  );
  const blockers = collectBlockers(plan, profiles, profileResults, closureSummaries);
  const claimIds = collectClaimIds(plan);
  const strongestVerdict = determineStarSimFusionBenchmarkVerdict({
    profileResults,
    blockers,
    uncertainty: uncertaintySummaries,
  });
  const passedClosureCount = profileResults.filter(
    (item) =>
      (item.integratedFusion.luminosityClosureRelErr ?? 0) <=
      plan.thresholds.luminosityClosureRelErrMax,
  ).length;
  const compared = profileResults.filter((item) => item.comparisonToStage1Proxy.compared);
  const report = {
    schemaVersion: "starsim-fusion-benchmark-report.v1",
    runId: `starsim-fusion-benchmark:${randomUUID()}`,
    planId: plan.planId,
    createdAt: new Date().toISOString(),
    profileResults,
    uncertaintySummaries,
    closureSummaries,
    aggregate: {
      profileCount: profileResults.length,
      passedClosureCount,
      failedClosureCount: profileResults.length - passedClosureCount,
      warningCount: closureSummaries.reduce((acc, item) => acc + item.warnings.length, 0),
      channelAgreementRate:
        compared.length > 0
          ? compared.filter((item) => item.comparisonToStage1Proxy.dominantChannelAgrees)
              .length / compared.length
          : undefined,
      fusionZoneAgreementRate:
        compared.length > 0
          ? compared.filter((item) => item.comparisonToStage1Proxy.fusionZoneModeAgrees)
              .length / compared.length
          : undefined,
      uncertaintyCoverageRate:
        uncertaintySummaries.length > 0
          ? uncertaintySummaries.filter((item) => item.mode !== "none").length /
            uncertaintySummaries.length
          : undefined,
      strongestVerdict,
    },
    blockers,
    evidence: {
      stage: "STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE",
      claimTier: "Stage2_candidate_benchmark_support",
      claimIds,
      citations: citationsForStarSimFusionBenchmarkClaims(claimIds),
      sourceRoles: Object.fromEntries(claimIds.map((claimId) => [claimId, "supports_model"])),
      uncertaintyNotes: uncertaintyNotesForStarSimFusionBenchmarkClaims(claimIds),
    },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: [
        "Benchmark support remains an astrophysical prior and cannot promote QST, ER=EPR, Needle Hull, or warp claims.",
      ],
    },
  };
  return starSimFusionBenchmarkReportSchema.parse(report) as StarSimFusionBenchmarkReport;
}

function collectBlockers(
  plan: StarSimFusionBenchmarkPlan,
  profiles: Array<{ ref: StarSimFusionBenchmarkPlan["profileRefs"][number]; profile: StarSimFusionProfileImport }>,
  results: StarSimFusionProfileValidation[],
  closures: StarSimFusionClosureSummary[],
): StarSimFusionBenchmarkBlocker[] {
  const blockers: StarSimFusionBenchmarkBlocker[] = [];
  if (plan.uncertaintyPolicy.mode === "none") {
    blockers.push({
      blockerId: "missing_uncertainty_model",
      detail: "Stage 2 candidate readiness requires interval or Monte Carlo fixture uncertainty.",
    });
  }
  profiles.forEach(({ ref, profile }, index) => {
    if (!ref.profileHash && !profile.sourceHash && !profile.mesaMetadata?.profileHash) {
      blockers.push({
        blockerId: "missing_profile_hash",
        objectId: ref.objectId,
        detail: "Profile hash is required for benchmark readiness.",
      });
    }
    if (
      profile.provenance.reproducibilityStatus === "mesa_imported" &&
      (!profile.mesaMetadata?.inlistHash || !profile.mesaMetadata?.network)
    ) {
      blockers.push({
        blockerId: "missing_mesa_metadata",
        objectId: ref.objectId,
        detail: "MESA imports require inlist hash and network metadata.",
      });
    }
    if (
      (results[index].integratedFusion.luminosityClosureRelErr ?? 0) >
      plan.thresholds.luminosityClosureRelErrMax
    ) {
      blockers.push({
        blockerId: "luminosity_closure_failed",
        objectId: ref.objectId,
        detail: "Integrated nuclear luminosity exceeded surface luminosity closure tolerance.",
      });
    }
    if (closures[index].warnings.includes("mesa_import_missing_network_metadata")) {
      blockers.push({
        blockerId: "missing_mesa_metadata",
        objectId: ref.objectId,
        detail: "Closure check found missing MESA network metadata.",
      });
    }
    if (
      profile.hSpectralFit?.role === "new_measurement_of_h" ||
      profile.hSpectralFit?.role === "varying_planck_constant"
    ) {
      blockers.push({
        blockerId: "h_spectral_fit_overclaim",
        objectId: ref.objectId,
        detail: "hSpectralFit must remain calibration_only.",
      });
    }
  });
  return blockers;
}

function collectClaimIds(plan: StarSimFusionBenchmarkPlan): StarSimFusionBenchmarkClaimId[] {
  const ids: StarSimFusionBenchmarkClaimId[] = [
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.mesaProfileBenchmarkRequiresMetadata,
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.stellarProfileLuminosityClosureCheck,
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.stellarProfileUncertaintyPropagationRequired,
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.fusionChannelBenchmarkFromIntegratedEps,
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.fusionZoneBenchmarkFromCumulativeLuminosity,
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.surfaceTeffIsObservableClosureNotCoreTemperature,
    STARSIM_FUSION_BENCHMARK_CLAIM_IDS.starsimFusionBenchmarkNotDirectErEprEvidence,
  ];
  if (plan.benchmarkSet === "compact_object_glitch_context") {
    ids.push(STARSIM_FUSION_BENCHMARK_CLAIM_IDS.neutronStarGlitchBenchmarkNotFusion);
  }
  return [...new Set(ids)];
}
