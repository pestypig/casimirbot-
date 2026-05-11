import { z } from "zod";
import {
  citationsForStarSimFusionStage2GateClaims,
  STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS,
  uncertaintyNotesForStarSimFusionStage2GateClaims,
  type StarSimFusionStage2GateClaimId,
} from "./starsim-fusion-stage2-gate-claims";
import {
  starSimFusionExternalReproManifestSchema,
  type StarSimFusionExternalReproManifest,
} from "./starsim-fusion-external-repro";
import {
  starSimSolarFusionAnchorSchema,
  type StarSimSolarFusionAnchor,
} from "./starsim-fusion-solar-anchor";
import {
  starSimFusionNeutrinoClosureSchema,
  type StarSimFusionNeutrinoClosure,
} from "./starsim-fusion-neutrino-closure";
import {
  starSimFusionAsteroseismicClosureSchema,
  type StarSimFusionAsteroseismicClosure,
} from "./starsim-fusion-asteroseismic-closure";
import { starSimFusionBenchmarkReportSchema } from "./starsim-fusion-benchmark-runner";
import type { StarSimFusionBenchmarkReport } from "./starsim-fusion-benchmark-runner";
import { validateStarSimFusionStage2GateSafeLanguage } from "./starsim-fusion-stage2-gate-safe-language";

export type StarSimFusionStage2GateVerdict =
  | "stage2_gate_not_tested"
  | "stage2_gate_blocked"
  | "stage2_gate_fixture_only"
  | "stage2_gate_mesa_reproduced"
  | "stage2_gate_observational_closure_partial"
  | "stage2_gate_ready_for_review"
  | "overclaim_blocked";

export type StarSimFusionStage2GateBlocker = {
  blockerId:
    | "missing_mesa_profile_hash"
    | "missing_inlist_hash"
    | "missing_network_metadata"
    | "missing_rates_metadata"
    | "missing_uncertainty_summary"
    | "luminosity_closure_failed"
    | "neutrino_closure_failed"
    | "asteroseismic_closure_failed"
    | "safe_language_failed"
    | "direct_er_epr_overclaim"
    | "qst_cl_promotion_attempt"
    | "h_spectral_fit_overclaim";
  detail: string;
};

export const starSimFusionStage2GateArtifactSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-stage2-gate-artifact.v1"),
  runId: z.string().min(1),
  createdAt: z.string().datetime(),
  externalReproManifest: starSimFusionExternalReproManifestSchema,
  benchmarkReportRef: z.string().min(1),
  benchmarkReport: starSimFusionBenchmarkReportSchema,
  solarAnchor: starSimSolarFusionAnchorSchema.optional(),
  neutrinoClosure: starSimFusionNeutrinoClosureSchema.optional(),
  asteroseismicClosure: starSimFusionAsteroseismicClosureSchema.optional(),
  verdict: z.enum([
    "stage2_gate_not_tested",
    "stage2_gate_blocked",
    "stage2_gate_fixture_only",
    "stage2_gate_mesa_reproduced",
    "stage2_gate_observational_closure_partial",
    "stage2_gate_ready_for_review",
    "overclaim_blocked",
  ]),
  blockers: z.array(
    z.object({
      blockerId: z.string(),
      detail: z.string(),
    }),
  ),
  evidence: z.object({
    stage: z.literal("STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE"),
    claimTier: z.enum(["Stage2_gate_ready_for_review", "Stage2_gate_blocked"]),
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    sourceRoles: z.record(
      z.string(),
      z.enum([
        "supports_model",
        "supports_observational_closure",
        "supports_guardrail",
        "supports_boundary",
      ]),
    ),
    uncertaintyNotes: z.array(z.string()).min(1),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string()).min(1),
  }),
});

export type StarSimFusionStage2GateArtifact = z.infer<
  typeof starSimFusionStage2GateArtifactSchema
> & {
  externalReproManifest: StarSimFusionExternalReproManifest;
  benchmarkReport: StarSimFusionBenchmarkReport;
  solarAnchor?: StarSimSolarFusionAnchor;
  neutrinoClosure?: StarSimFusionNeutrinoClosure;
  asteroseismicClosure?: StarSimFusionAsteroseismicClosure;
  verdict: StarSimFusionStage2GateVerdict;
  blockers: StarSimFusionStage2GateBlocker[];
};

export function runStarSimFusionStage2Gate(input: {
  externalReproManifest: StarSimFusionExternalReproManifest;
  benchmarkReport: StarSimFusionBenchmarkReport;
  benchmarkReportRef: string;
  solarAnchor?: StarSimSolarFusionAnchor;
  neutrinoClosure?: StarSimFusionNeutrinoClosure;
  asteroseismicClosure?: StarSimFusionAsteroseismicClosure;
}): StarSimFusionStage2GateArtifact {
  const externalReproManifest = starSimFusionExternalReproManifestSchema.parse(
    input.externalReproManifest,
  );
  const benchmarkReport = starSimFusionBenchmarkReportSchema.parse(
    input.benchmarkReport,
  ) as StarSimFusionBenchmarkReport;
  const solarAnchor = input.solarAnchor
    ? starSimSolarFusionAnchorSchema.parse(input.solarAnchor)
    : undefined;
  const neutrinoClosure = input.neutrinoClosure
    ? starSimFusionNeutrinoClosureSchema.parse(input.neutrinoClosure)
    : undefined;
  const asteroseismicClosure = input.asteroseismicClosure
    ? starSimFusionAsteroseismicClosureSchema.parse(input.asteroseismicClosure)
    : undefined;
  const blockers = collectStage2GateBlockers({
    externalReproManifest,
    benchmarkReport,
    solarAnchor,
    neutrinoClosure,
    asteroseismicClosure,
  });
  const claimIds = collectStage2GateClaimIds({
    solarAnchor,
    neutrinoClosure,
    asteroseismicClosure,
    externalReproManifest,
  });
  const verdict = determineStage2GateVerdict({
    externalReproManifest,
    blockers,
    neutrinoClosure,
    asteroseismicClosure,
  });
  const artifact = {
    schemaVersion: "starsim-fusion-stage2-gate-artifact.v1",
    runId: externalReproManifest.runId,
    createdAt: new Date().toISOString(),
    externalReproManifest,
    benchmarkReportRef: input.benchmarkReportRef,
    benchmarkReport,
    solarAnchor,
    neutrinoClosure,
    asteroseismicClosure,
    verdict,
    blockers,
    evidence: {
      stage: "STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE",
      claimTier:
        verdict === "stage2_gate_ready_for_review"
          ? "Stage2_gate_ready_for_review"
          : "Stage2_gate_blocked",
      claimIds,
      citations: citationsForStarSimFusionStage2GateClaims(claimIds),
      sourceRoles: sourceRolesForClaims(claimIds),
      uncertaintyNotes: uncertaintyNotesForStarSimFusionStage2GateClaims(claimIds),
    },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: [
        "Stage 2 gate evidence remains an astrophysical prior for QST and cannot promote ER=EPR, Needle Hull, warp, stress-energy, or CL0-CL4 claims.",
      ],
    },
  };
  return starSimFusionStage2GateArtifactSchema.parse(artifact) as StarSimFusionStage2GateArtifact;
}

function collectStage2GateBlockers(input: {
  externalReproManifest: StarSimFusionExternalReproManifest;
  benchmarkReport: StarSimFusionBenchmarkReport;
  solarAnchor?: StarSimSolarFusionAnchor;
  neutrinoClosure?: StarSimFusionNeutrinoClosure;
  asteroseismicClosure?: StarSimFusionAsteroseismicClosure;
}): StarSimFusionStage2GateBlocker[] {
  const blockers: StarSimFusionStage2GateBlocker[] = [];
  const manifest = input.externalReproManifest;
  if (manifest.claimRole === "direct_er_epr_evidence") {
    blockers.push({
      blockerId: "direct_er_epr_overclaim",
      detail: "StarSim fusion gate cannot be direct ER=EPR evidence.",
    });
  }
  if (manifest.requestedSpacetimeCL && manifest.requestedSpacetimeCL !== "proxy_only") {
    blockers.push({
      blockerId: "qst_cl_promotion_attempt",
      detail: "Stage 2 gate cannot promote spacetimeCL above proxy_only.",
    });
  }
  if (
    manifest.hSpectralFit?.role === "new_measurement_of_h" ||
    manifest.hSpectralFit?.role === "varying_planck_constant" ||
    manifest.hSpectralFit?.mayInferNewH === true
  ) {
    blockers.push({
      blockerId: "h_spectral_fit_overclaim",
      detail: "hSpectralFit must remain calibration_only.",
    });
  }
  if (!manifest.mesa?.profileHash) {
    blockers.push({
      blockerId: "missing_mesa_profile_hash",
      detail: "Ready-for-review requires a MESA/profile hash.",
    });
  }
  if (!manifest.mesa?.inlistHash) {
    blockers.push({
      blockerId: "missing_inlist_hash",
      detail: "Ready-for-review requires an inlist hash.",
    });
  }
  if (!manifest.mesa?.network) {
    blockers.push({
      blockerId: "missing_network_metadata",
      detail: "Ready-for-review requires nuclear network metadata.",
    });
  }
  if (!manifest.mesa?.ratesSource) {
    blockers.push({
      blockerId: "missing_rates_metadata",
      detail: "Ready-for-review requires nuclear reaction-rate metadata.",
    });
  }
  if (
    input.benchmarkReport.aggregate.uncertaintyCoverageRate === undefined ||
    input.benchmarkReport.aggregate.uncertaintyCoverageRate <= 0 ||
    input.benchmarkReport.evidence.uncertaintyNotes.length === 0
  ) {
    blockers.push({
      blockerId: "missing_uncertainty_summary",
      detail: "Ready-for-review requires a benchmark uncertainty summary.",
    });
  }
  if (input.benchmarkReport.aggregate.failedClosureCount > 0) {
    blockers.push({
      blockerId: "luminosity_closure_failed",
      detail: "Benchmark luminosity closure failed for one or more profiles.",
    });
  }
  if (input.solarAnchor && input.neutrinoClosure?.status === "fail") {
    blockers.push({
      blockerId: "neutrino_closure_failed",
      detail: "Solar neutrino closure failed.",
    });
  }
  if (input.asteroseismicClosure?.status === "fail") {
    blockers.push({
      blockerId: "asteroseismic_closure_failed",
      detail: "Asteroseismic or helioseismic closure failed.",
    });
  }
  return blockers;
}

function determineStage2GateVerdict(input: {
  externalReproManifest: StarSimFusionExternalReproManifest;
  blockers: StarSimFusionStage2GateBlocker[];
  neutrinoClosure?: StarSimFusionNeutrinoClosure;
  asteroseismicClosure?: StarSimFusionAsteroseismicClosure;
}): StarSimFusionStage2GateVerdict {
  if (
    input.blockers.some((blocker) =>
      [
        "direct_er_epr_overclaim",
        "qst_cl_promotion_attempt",
        "h_spectral_fit_overclaim",
      ].includes(blocker.blockerId),
    )
  ) {
    return "overclaim_blocked";
  }
  if (input.externalReproManifest.reproducibilityStatus === "failed") {
    return "stage2_gate_blocked";
  }
  if (input.externalReproManifest.reproducibilityStatus === "fixture_only") {
    return "stage2_gate_fixture_only";
  }
  if (input.blockers.length > 0) {
    return "stage2_gate_blocked";
  }
  if (
    input.neutrinoClosure?.status === "warn" ||
    input.asteroseismicClosure?.status === "warn"
  ) {
    return "stage2_gate_observational_closure_partial";
  }
  if (
    input.externalReproManifest.reproducibilityStatus === "mesa_reproduced" ||
    input.externalReproManifest.reproducibilityStatus === "mesa_gyre_reproduced" ||
    input.externalReproManifest.reproducibilityStatus === "externally_reproduced"
  ) {
    return "stage2_gate_ready_for_review";
  }
  if (input.externalReproManifest.reproducibilityStatus === "mesa_imported") {
    return "stage2_gate_mesa_reproduced";
  }
  return "stage2_gate_not_tested";
}

function collectStage2GateClaimIds(input: {
  solarAnchor?: StarSimSolarFusionAnchor;
  neutrinoClosure?: StarSimFusionNeutrinoClosure;
  asteroseismicClosure?: StarSimFusionAsteroseismicClosure;
  externalReproManifest: StarSimFusionExternalReproManifest;
}): StarSimFusionStage2GateClaimId[] {
  const ids: StarSimFusionStage2GateClaimId[] = [
    STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.mesaExternalReproductionRequiresInlistAndProfileHash,
    STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.stellarProfileStage2GateRequiresUncertainty,
    STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.stellarProfileStage2GateNotCertification,
    STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.hSpectralFitStage2GateCalibrationOnly,
    STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.starsimFusionStage2GateNotDirectErEprEvidence,
  ];
  if (input.solarAnchor) {
    ids.push(STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.solarAnchorRequiresNeutrinoClosure);
  }
  if (input.neutrinoClosure) {
    ids.push(STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.solarNeutrinoPpChainObservationalProbe);
  }
  if (input.asteroseismicClosure) {
    ids.push(STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.gyreAsteroseismicClosureModelComparison);
  }
  if (input.externalReproManifest.objectId.toLowerCase().includes("neutron")) {
    ids.push(STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.neutronStarStage2GateCompactObjectOnly);
  }
  return [...new Set(ids)];
}

function sourceRolesForClaims(claimIds: StarSimFusionStage2GateClaimId[]) {
  return Object.fromEntries(
    claimIds.map((claimId) => {
      const role =
        claimId.includes("neutrino") || claimId.includes("gyre")
          ? "supports_observational_closure"
          : claimId.includes("not_direct") || claimId.includes("calibration")
            ? "supports_boundary"
            : "supports_model";
      return [claimId, role];
    }),
  );
}

export function validateStarSimFusionStage2GateArtifactLanguage(
  artifact: StarSimFusionStage2GateArtifact,
) {
  const safe = validateStarSimFusionStage2GateSafeLanguage(
    `${artifact.verdict}\n${artifact.evidence.claimIds.join("\n")}\n${artifact.qstBoundary.caveats.join("\n")}`,
  );
  if (!safe.ok) {
    return {
      ok: false,
      blockers: safe.forbiddenPhrases.map(
        (phrase): StarSimFusionStage2GateBlocker => ({
          blockerId: "safe_language_failed",
          detail: `Forbidden phrase: ${phrase}`,
        }),
      ),
    };
  }
  return { ok: true, blockers: [] as StarSimFusionStage2GateBlocker[] };
}
