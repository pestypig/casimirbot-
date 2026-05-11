import { z } from "zod";
import {
  citationsForStarSimFusionProfileClaims,
  STARSIM_FUSION_PROFILE_CLAIM_IDS,
  uncertaintyNotesForStarSimFusionProfileClaims,
  type StarSimFusionProfileClaimId,
} from "./starsim-fusion-profile-claims";
import {
  parseStarSimFusionProfileImport,
  starSimFusionProfileSourceSchema,
  type StarSimFusionProfileImport,
  type StarSimFusionProfileShell,
} from "./starsim-fusion-profile-import";
import {
  starSimFusionChannelSchema,
  type StarSimFusionMicrophysicsEvaluation,
} from "./starsim-fusion-microphysics";

const L_SUN_ERG_S = 3.828e33;

export const starSimFusionProfileValidationSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-profile-validation.v1"),
  objectId: z.string(),
  importedProfileSummary: z.object({
    shellCount: z.number().int().nonnegative(),
    source: starSimFusionProfileSourceSchema,
    reproducibilityStatus: z.enum([
      "fixture_only",
      "reduced_order_simulated",
      "mesa_imported",
      "externally_reproduced",
    ]),
  }),
  integratedFusion: z.object({
    integratedNucLuminosity_Lsun: z.number().nonnegative().optional(),
    surfaceLuminosity_Lsun: z.number().positive().optional(),
    luminosityClosureRelErr: z.number().nonnegative().optional(),
    ppFraction: z.number().min(0).max(1).optional(),
    cnoFraction: z.number().min(0).max(1).optional(),
    tripleAlphaFraction: z.number().min(0).max(1).optional(),
    dominantFusionChannel: starSimFusionChannelSchema,
  }),
  fusionZone: z.object({
    mode: z.enum([
      "core_fusion",
      "shell_fusion",
      "distributed_convective_core",
      "compact_object_not_applicable",
      "unknown",
    ]),
    r10_Rstar: z.number().min(0).max(1).optional(),
    r50_Rstar: z.number().min(0).max(1).optional(),
    r90_Rstar: z.number().min(0).max(1).optional(),
    activeVolumeFraction: z.number().min(0).max(1).optional(),
  }),
  comparisonToStage1Proxy: z.object({
    compared: z.boolean(),
    dominantChannelAgrees: z.boolean().optional(),
    fusionZoneModeAgrees: z.boolean().optional(),
    r90Delta: z.number().optional(),
    notes: z.array(z.string()),
  }),
  qstBoundary: z.object({
    qstRole: z.enum([
      "stellar_quantum_microphysics_prior",
      "cosmological_structure_prior",
      "not_direct_er_epr_evidence",
    ]),
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string()).min(1),
  }),
  evidence: z.object({
    stage: z.literal("STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP"),
    claimTier: z.literal("Stage1_to_Stage2_profile_validation_prep"),
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    uncertaintyNotes: z.array(z.string()).min(1),
  }),
});

export type StarSimFusionProfileValidation = z.infer<
  typeof starSimFusionProfileValidationSchema
>;

type ShellContribution = {
  radius_Rstar?: number;
  total: number;
  pp: number;
  cno: number;
  tripleAlpha: number;
};

export function validateStarSimFusionProfile(
  rawProfile: StarSimFusionProfileImport,
  stage1Proxy?: StarSimFusionMicrophysicsEvaluation,
): StarSimFusionProfileValidation {
  const profile = parseStarSimFusionProfileImport(rawProfile);
  const claimIds: StarSimFusionProfileClaimId[] = [
    STARSIM_FUSION_PROFILE_CLAIM_IDS.mesaProfileImportProfileValidation,
    STARSIM_FUSION_PROFILE_CLAIM_IDS.starsimProfileImportNotDirectErEprEvidence,
  ];

  if (profile.hSpectralFit) {
    claimIds.push(
      STARSIM_FUSION_PROFILE_CLAIM_IDS.hSpectralFitCalibrationOnlyExactSiGuardrail,
    );
  }

  if (profile.stellarClass.objectClass === "neutron_star") {
    claimIds.push(STARSIM_FUSION_PROFILE_CLAIM_IDS.neutronStarProfileNotFusionProfile);
    return finalizeValidation({
      profile,
      claimIds,
      integrated: {
        dominantFusionChannel: "compact_object_not_fusing",
      },
      fusionZone: { mode: "compact_object_not_applicable" },
      stage1Proxy,
      caveats: [
        "Neutron-star profile uses compact-object quantum-fluid context, not PP/CNO fusion integration.",
        "Profile validation remains proxy-only and cannot promote QST or ER=EPR claims.",
      ],
    });
  }

  claimIds.push(
    STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionLuminosityMassShellIntegration,
    STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionChannelFractionFromIntegratedEps,
    STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionZoneRadiiFromCumulativeLuminosity,
    STARSIM_FUSION_PROFILE_CLAIM_IDS.surfaceLuminosityNotIdenticalToNuclearLuminosityGuardrail,
  );

  const contributions = profile.shells
    .slice()
    .sort((a, b) => a.shellIndex - b.shellIndex)
    .map((shell, index, shells) => shellContribution(shell, index, shells));
  const total = sum(contributions.map((item) => item.total));
  const pp = sum(contributions.map((item) => item.pp));
  const cno = sum(contributions.map((item) => item.cno));
  const tripleAlpha = sum(contributions.map((item) => item.tripleAlpha));
  const ppFraction = total > 0 ? pp / total : undefined;
  const cnoFraction = total > 0 ? cno / total : undefined;
  const tripleAlphaFraction = total > 0 ? tripleAlpha / total : undefined;
  const integratedNucLuminosity_Lsun = total > 0 ? total / L_SUN_ERG_S : undefined;
  const surfaceLuminosity_Lsun = profile.global.luminosity_Lsun;
  const luminosityClosureRelErr =
    integratedNucLuminosity_Lsun && surfaceLuminosity_Lsun
      ? Math.abs(integratedNucLuminosity_Lsun - surfaceLuminosity_Lsun) /
        surfaceLuminosity_Lsun
      : undefined;
  const dominantFusionChannel = dominantChannel(ppFraction, cnoFraction, tripleAlphaFraction);
  const r10_Rstar = radiusAtFraction(contributions, total, 0.1);
  const r50_Rstar = radiusAtFraction(contributions, total, 0.5);
  const r90_Rstar = radiusAtFraction(contributions, total, 0.9);
  const fusionZoneMode = inferFusionZoneMode(profile, dominantFusionChannel, r50_Rstar);
  const caveats = [
    "Profile validation prepares Stage 2 review but remains Stage 1-to-Stage 2 prep.",
    "Profile output is not direct ER=EPR evidence and cannot promote CL0-CL4.",
  ];
  if (luminosityClosureRelErr !== undefined && luminosityClosureRelErr > 0.25) {
    caveats.push("Luminosity closure warning: integrated nuclear luminosity differs from surface luminosity beyond tolerance.");
  }

  return finalizeValidation({
    profile,
    claimIds,
    integrated: {
      integratedNucLuminosity_Lsun,
      surfaceLuminosity_Lsun,
      luminosityClosureRelErr,
      ppFraction,
      cnoFraction,
      tripleAlphaFraction,
      dominantFusionChannel,
    },
    fusionZone: {
      mode: fusionZoneMode,
      r10_Rstar,
      r50_Rstar,
      r90_Rstar,
      activeVolumeFraction: r90_Rstar !== undefined ? Math.pow(r90_Rstar, 3) : undefined,
    },
    stage1Proxy,
    caveats,
  });
}

function finalizeValidation(args: {
  profile: StarSimFusionProfileImport;
  claimIds: StarSimFusionProfileClaimId[];
  integrated: StarSimFusionProfileValidation["integratedFusion"];
  fusionZone: StarSimFusionProfileValidation["fusionZone"];
  stage1Proxy?: StarSimFusionMicrophysicsEvaluation;
  caveats: string[];
}): StarSimFusionProfileValidation {
  const comparison = compareToStage1(args.stage1Proxy, args.integrated, args.fusionZone);
  return starSimFusionProfileValidationSchema.parse({
    schemaVersion: "starsim-fusion-profile-validation.v1",
    objectId: args.profile.objectId,
    importedProfileSummary: {
      shellCount: args.profile.shells.length,
      source: args.profile.source,
      reproducibilityStatus: args.profile.provenance.reproducibilityStatus,
    },
    integratedFusion: args.integrated,
    fusionZone: args.fusionZone,
    comparisonToStage1Proxy: comparison,
    qstBoundary: {
      qstRole:
        args.profile.provenance.qstRole === "cosmological_structure_prior"
          ? "cosmological_structure_prior"
          : args.profile.provenance.qstRole === "not_direct_er_epr_evidence"
            ? "not_direct_er_epr_evidence"
            : "stellar_quantum_microphysics_prior",
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: args.caveats,
    },
    evidence: {
      stage: "STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP",
      claimTier: "Stage1_to_Stage2_profile_validation_prep",
      claimIds: [...new Set(args.claimIds)],
      citations: citationsForStarSimFusionProfileClaims([...new Set(args.claimIds)]),
      uncertaintyNotes: uncertaintyNotesForStarSimFusionProfileClaims([...new Set(args.claimIds)]),
    },
  });
}

function shellContribution(
  shell: StarSimFusionProfileShell,
  index: number,
  shells: StarSimFusionProfileShell[],
): ShellContribution {
  const shellMass = shell.shellMass_g ?? shellMassFromRadius(shell, index, shells);
  const pp = (shell.epsPp_erg_g_s ?? 0) * shellMass;
  const cno = (shell.epsCno_erg_g_s ?? 0) * shellMass;
  const tripleAlpha = (shell.epsTripleAlpha_erg_g_s ?? 0) * shellMass;
  const componentTotal = pp + cno + tripleAlpha;
  const total = (shell.epsNuc_erg_g_s ?? 0) * shellMass || componentTotal;
  return {
    radius_Rstar: shell.radius_Rstar,
    total,
    pp,
    cno,
    tripleAlpha,
  };
}

function shellMassFromRadius(
  shell: StarSimFusionProfileShell,
  index: number,
  shells: StarSimFusionProfileShell[],
) {
  if (!shell.radius_cm || !shell.density_g_cm3) return 0;
  const previousRadius = index > 0 ? shells[index - 1].radius_cm ?? 0 : 0;
  const volume = (4 / 3) * Math.PI * (Math.pow(shell.radius_cm, 3) - Math.pow(previousRadius, 3));
  return Math.max(0, volume * shell.density_g_cm3);
}

function dominantChannel(pp?: number, cno?: number, tripleAlpha?: number) {
  const entries: Array<["pp_chain" | "cno_cycle" | "triple_alpha", number]> = [
    ["pp_chain", pp ?? 0],
    ["cno_cycle", cno ?? 0],
    ["triple_alpha", tripleAlpha ?? 0],
  ];
  const [name, value] = entries.sort((a, b) => b[1] - a[1])[0];
  return value > 0 ? name : "none";
}

function radiusAtFraction(contributions: ShellContribution[], total: number, fraction: number) {
  if (total <= 0) return undefined;
  let cumulative = 0;
  for (const contribution of contributions) {
    cumulative += contribution.total;
    if (cumulative >= total * fraction) return contribution.radius_Rstar;
  }
  return contributions.at(-1)?.radius_Rstar;
}

function inferFusionZoneMode(
  profile: StarSimFusionProfileImport,
  channel: ReturnType<typeof dominantChannel>,
  r50?: number,
) {
  if (profile.stellarClass.objectClass === "red_giant") return "shell_fusion";
  if (channel === "cno_cycle") return "distributed_convective_core";
  if (channel === "none") return "unknown";
  if (r50 !== undefined && r50 > 0.25) return "shell_fusion";
  return "core_fusion";
}

function compareToStage1(
  stage1Proxy: StarSimFusionMicrophysicsEvaluation | undefined,
  integrated: StarSimFusionProfileValidation["integratedFusion"],
  fusionZone: StarSimFusionProfileValidation["fusionZone"],
) {
  if (!stage1Proxy) {
    return {
      compared: false,
      notes: ["No Stage 1 proxy evaluation was supplied for comparison."],
    };
  }
  const r90Delta =
    fusionZone.r90_Rstar !== undefined && stage1Proxy.fusionZone.r90_Rstar !== undefined
      ? fusionZone.r90_Rstar - stage1Proxy.fusionZone.r90_Rstar
      : undefined;
  return {
    compared: true,
    dominantChannelAgrees:
      stage1Proxy.inferred.dominantFusionChannel === integrated.dominantFusionChannel,
    fusionZoneModeAgrees: stage1Proxy.fusionZone.mode === fusionZone.mode,
    r90Delta,
    notes: ["Stage 1 proxy comparison is diagnostic only and cannot promote claim tier."],
  };
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}
