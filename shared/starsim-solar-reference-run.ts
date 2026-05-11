import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { starSimSolverRuntimePolicySchema } from "../server/modules/starsim/external/solver-runtime-policy";
import { runMesaSolarReference } from "../server/modules/starsim/external/mesa-solar-runner";
import { importStarSimGyreSummary } from "../server/modules/starsim/external/gyre-summary-import";
import { validateStarSimFusionProfile } from "./starsim-fusion-profile-validation";
import { runStarSimFusionBenchmarkPlan } from "./starsim-fusion-benchmark-runner";
import { computeStarSimFusionNeutrinoClosure } from "./starsim-fusion-neutrino-closure";
import { computeStarSimFusionAsteroseismicClosure } from "./starsim-fusion-asteroseismic-closure";
import { runStarSimFusionStage2Gate } from "./starsim-fusion-stage2-gate";
import { renderStarSimFusionStage2GateReport } from "./starsim-fusion-stage2-gate-safe-language";
import {
  citationsForStarSimSolarReferenceClaims,
  STARSIM_SOLAR_REFERENCE_CLAIM_IDS,
  uncertaintyNotesForStarSimSolarReferenceClaims,
  type StarSimSolarReferenceClaimId,
} from "./starsim-solar-reference-claims";
import {
  starSimSolarReferenceRunArtifactSchema,
  type StarSimSolarReferenceRunArtifact,
} from "./starsim-solar-reference-artifact";
import { renderStarSimSolarReferenceRun } from "./starsim-solar-reference-safe-language";

export const starSimSolarReferenceRunPlanSchema = z.object({
  schemaVersion: z.literal("starsim-solar-reference-run-plan.v1"),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  target: z.object({
    objectId: z.literal("Sun"),
    name: z.literal("Sun"),
  }),
  runtimePolicy: starSimSolverRuntimePolicySchema,
  fixturePaths: z
    .object({
      profilePath: z.string().optional(),
      historyPath: z.string().optional(),
      gyreSummaryPath: z.string().optional(),
      neutrinoTargetsPath: z.string().optional(),
    })
    .optional(),
  mesa: z.object({
    inlistPath: z.string().optional(),
    inlistHash: z.string().optional(),
    mesaVersion: z.string().optional(),
    network: z.string().optional(),
    ratesSource: z.string().optional(),
    eos: z.string().optional(),
    opacity: z.string().optional(),
    atmosphere: z.string().optional(),
    initialMass_Msun: z.number().positive(),
    initialMetallicity_Z: z.number().nonnegative().optional(),
    initialHelium_Y: z.number().nonnegative().optional(),
    mixingLengthAlpha: z.number().positive().optional(),
    targetAge_Gyr: z.number().positive(),
  }),
  gyre: z
    .object({
      enabled: z.boolean(),
      summaryPath: z.string().optional(),
      summaryHash: z.string().optional(),
    })
    .optional(),
  observationalClosures: z.object({
    solarLuminosity: z.boolean(),
    solarRadius: z.boolean(),
    effectiveTemperature: z.boolean(),
    neutrino: z.boolean(),
    asteroseismic: z.boolean(),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    role: z.literal("stellar_quantum_microphysics_prior"),
  }),
});

export type StarSimSolarReferenceRunPlan = z.infer<
  typeof starSimSolarReferenceRunPlanSchema
>;

export function runStarSimSolarReferenceRun(args: {
  plan: StarSimSolarReferenceRunPlan;
  outPath: string;
}): StarSimSolarReferenceRunArtifact {
  const plan = starSimSolarReferenceRunPlanSchema.parse(args.plan);
  const mesaResult = runMesaSolarReference({
    runtimePolicy: plan.runtimePolicy,
    fixtureProfilePath: plan.fixturePaths?.profilePath,
    mesa: plan.mesa,
  });
  if (!mesaResult.profile) {
    throw new Error(mesaResult.message);
  }
  if (
    plan.runtimePolicy.runtimeKind !== "fixture_only" &&
    mesaResult.status === "fixture_only"
  ) {
    throw new Error("External runtime cannot silently fall back to fixture mode.");
  }
  const outputDir = dirname(args.outPath);
  mkdirSync(outputDir, { recursive: true });
  const profilePath = `${outputDir}/starsim-solar-reference-profile.json`;
  writeFileSync(profilePath, JSON.stringify(mesaResult.profile, null, 2));
  const profileValidation = validateStarSimFusionProfile(mesaResult.profile);
  const profileValidationPath = `${outputDir}/starsim-solar-reference-profile-validation.json`;
  writeFileSync(profileValidationPath, JSON.stringify(profileValidation, null, 2));
  const benchmarkPath = `${outputDir}/starsim-solar-reference-benchmark.json`;
  const benchmarkReport = runStarSimFusionBenchmarkPlan({
    schemaVersion: "starsim-fusion-benchmark-plan.v1",
    planId: `${plan.planId}:benchmark`,
    createdAt: plan.createdAt,
    benchmarkSet: "solar_reference",
    profileRefs: [
      {
        objectId: "Sun",
        profilePath,
        profileHash: mesaResult.profileHash,
        source:
          plan.runtimePolicy.runtimeKind === "fixture_only" ? "mesa_fixture" : "mesa_profile",
      },
    ],
    thresholds: {
      luminosityClosureRelErrMax: 100,
      r90DeltaMax: 0.2,
      channelFractionAgreementMin: 0.8,
      stage1ProxyAgreementMin: 0.8,
      uncertaintyCoverageMin: 0.8,
    },
    uncertaintyPolicy: { mode: "interval", samples: 2, seed: 11, perturb: "profile_shells_only" },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      role: "stellar_quantum_microphysics_prior",
    },
  });
  writeFileSync(benchmarkPath, JSON.stringify(benchmarkReport, null, 2));
  const neutrinoTarget = plan.fixturePaths?.neutrinoTargetsPath
    ? JSON.parse(readFileSync(plan.fixturePaths.neutrinoTargetsPath, "utf8"))
    : undefined;
  const neutrinoClosure =
    plan.observationalClosures.neutrino && neutrinoTarget
      ? computeStarSimFusionNeutrinoClosure(neutrinoTarget)
      : undefined;
  const gyreSummary = importStarSimGyreSummary({
    enabled: plan.gyre?.enabled ?? false,
    summaryPath: plan.gyre?.summaryPath ?? plan.fixturePaths?.gyreSummaryPath,
    summaryHash: plan.gyre?.summaryHash,
    requireSummaryHash: plan.runtimePolicy.runtimeKind !== "fixture_only" && Boolean(plan.gyre?.enabled),
  });
  const asteroseismicClosure =
    plan.observationalClosures.asteroseismic && gyreSummary.source !== "not_available"
      ? computeStarSimFusionAsteroseismicClosure({
          objectId: "Sun",
          source:
            gyreSummary.source === "gyre_external_run"
              ? "gyre_external_run"
              : "gyre_imported_summary",
          modelSummary: {
            largeSeparation_uHz: gyreSummary.largeSeparation_uHz,
            smallSeparation_uHz: gyreSummary.smallSeparation_uHz,
            modeCount: gyreSummary.modeCount,
            lowDegreeModesAvailable: gyreSummary.lowDegreeModesAvailable,
            soundSpeedProfileAvailable: gyreSummary.soundSpeedProfileAvailable,
          },
          referenceSummary: {
            largeSeparation_uHz: 135.1,
            smallSeparation_uHz: 9.05,
            modeCount: gyreSummary.modeCount,
            sourceRef: "solar-reference-fixture",
          },
        })
      : undefined;
  const gatePath = `${outputDir}/starsim-solar-reference-stage2-gate.json`;
  const stage2Gate = runStarSimFusionStage2Gate({
    externalReproManifest: {
      schemaVersion: "starsim-fusion-external-repro-manifest.v1",
      runId: `${plan.planId}:stage2-gate`,
      createdAt: plan.createdAt,
      objectId: "Sun",
      profileSource:
        plan.runtimePolicy.runtimeKind === "fixture_only" ? "mesa_fixture" : "mesa_external_run",
      mesa: {
        mesaVersion: plan.mesa.mesaVersion,
        inlistHash: plan.mesa.inlistHash ?? mesaResult.inlistHash,
        profileHash: mesaResult.profileHash,
        historyHash: mesaResult.profile?.mesaMetadata?.historyHash,
        network: plan.mesa.network,
        ratesSource: plan.mesa.ratesSource,
        eos: plan.mesa.eos,
        opacity: plan.mesa.opacity,
        atmosphere: plan.mesa.atmosphere,
        initialMass_Msun: plan.mesa.initialMass_Msun,
        initialMetallicity_Z: plan.mesa.initialMetallicity_Z,
        initialHelium_Y: plan.mesa.initialHelium_Y,
        mixingLengthAlpha: plan.mesa.mixingLengthAlpha,
        age_Gyr: plan.mesa.targetAge_Gyr,
      },
      gyre:
        gyreSummary.source !== "not_available"
          ? {
              gyreVersion: "fixture",
              modeSummaryHash: gyreSummary.summaryHash,
              adiabatic: true,
              nonAdiabatic: false,
            }
          : undefined,
      artifacts: {
        profilePath,
        historyPath: plan.fixturePaths?.historyPath,
        gyreSummaryPath: plan.fixturePaths?.gyreSummaryPath,
        benchmarkReportPath: benchmarkPath,
      },
      reproducibilityStatus:
        plan.runtimePolicy.runtimeKind === "fixture_only"
          ? "fixture_only"
          : gyreSummary.source !== "not_available"
            ? "mesa_gyre_reproduced"
            : "mesa_reproduced",
      claimRole: "not_direct_er_epr_evidence",
      hSpectralFit: { role: "calibration_only", mayInferNewH: false },
    },
    benchmarkReport,
    benchmarkReportRef: benchmarkPath,
    neutrinoClosure,
    asteroseismicClosure,
  });
  writeFileSync(gatePath, JSON.stringify(stage2Gate, null, 2));
  writeFileSync(gatePath.replace(/\.json$/i, ".md"), renderStarSimFusionStage2GateReport(stage2Gate));
  const claimIds = collectClaimIds(plan);
  const artifact = starSimSolarReferenceRunArtifactSchema.parse({
    schemaVersion: "starsim-solar-reference-run-artifact.v1",
    runId: `starsim-solar-reference:${randomUUID()}`,
    planId: plan.planId,
    createdAt: new Date().toISOString(),
    reproducibilityStatus:
      plan.runtimePolicy.runtimeKind === "fixture_only" ? "fixture_only" : "mesa_gyre_reproduced",
    mesaMetadata: {
      mesaVersion: plan.mesa.mesaVersion,
      inlistHash: plan.mesa.inlistHash ?? mesaResult.inlistHash,
      profileHash: mesaResult.profileHash,
      historyHash: mesaResult.profile.mesaMetadata?.historyHash,
      network: plan.mesa.network,
      ratesSource: plan.mesa.ratesSource,
      eos: plan.mesa.eos,
      opacity: plan.mesa.opacity,
      atmosphere: plan.mesa.atmosphere,
      initialMass_Msun: plan.mesa.initialMass_Msun,
      initialMetallicity_Z: plan.mesa.initialMetallicity_Z,
      initialHelium_Y: plan.mesa.initialHelium_Y,
      mixingLengthAlpha: plan.mesa.mixingLengthAlpha,
      age_Gyr: plan.mesa.targetAge_Gyr,
    },
    importedProfileRef: profilePath,
    fusionProfileValidationRef: profileValidationPath,
    benchmarkReportRef: benchmarkPath,
    stage2GateReportRef: gatePath,
    closures: {
      luminosityClosureStatus:
        benchmarkReport.aggregate.failedClosureCount > 0 ? "fail" : "pass",
      neutrinoClosureStatus: neutrinoClosure?.status ?? "not_tested",
      asteroseismicClosureStatus: asteroseismicClosure?.status ?? "not_tested",
    },
    evidence: {
      stage: "STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1",
      claimTier:
        plan.runtimePolicy.runtimeKind === "fixture_only"
          ? "fixture_only_solar_reference"
          : "solver_reproduced_solar_reference",
      claimIds,
      citations: citationsForStarSimSolarReferenceClaims(claimIds),
      sourceRoles: sourceRolesForClaims(claimIds),
      uncertaintyNotes: uncertaintyNotesForStarSimSolarReferenceClaims(claimIds),
    },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: [
        "Solar reference runs strengthen stellar microphysics checks only and cannot promote QST, ER=EPR, Needle Hull, warp, stress-energy, or CL0-CL4 claims.",
      ],
    },
  });
  const safeSummary = renderStarSimSolarReferenceRun(artifact);
  return starSimSolarReferenceRunArtifactSchema.parse({ ...artifact, safeSummary });
}

function collectClaimIds(plan: StarSimSolarReferenceRunPlan): StarSimSolarReferenceClaimId[] {
  const ids: StarSimSolarReferenceClaimId[] = [
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunRequiresSolverMetadata,
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunFixtureNotExternalReproduction,
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.mesaSolarProfileReproductionContext,
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarPpChainCrossSectionsContext,
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunNotErEprEvidence,
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunProxyOnlyQstBoundary,
    STARSIM_SOLAR_REFERENCE_CLAIM_IDS.hSpectralFitSolarReferenceCalibrationOnly,
  ];
  if (plan.observationalClosures.neutrino) {
    ids.push(STARSIM_SOLAR_REFERENCE_CLAIM_IDS.borexinoNeutrinoClosureContext);
  }
  if (plan.observationalClosures.asteroseismic) {
    ids.push(STARSIM_SOLAR_REFERENCE_CLAIM_IDS.gyreSolarOscillationSummaryContext);
  }
  return [...new Set(ids)];
}

function sourceRolesForClaims(claimIds: StarSimSolarReferenceClaimId[]) {
  return Object.fromEntries(
    claimIds.map((claimId) => {
      const role =
        claimId.includes("borexino") || claimId.includes("gyre")
          ? "supports_observational_closure"
          : claimId.includes("not_er_epr") ||
              claimId.includes("proxy_only") ||
              claimId.includes("calibration")
            ? "supports_boundary"
            : "supports_model";
      return [claimId, role];
    }),
  );
}
