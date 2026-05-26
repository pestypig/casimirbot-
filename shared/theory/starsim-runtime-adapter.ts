import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";
import {
  buildStarSimRuntimeReceiptV1,
  type StarSimRuntimeReceiptV1,
} from "../contracts/starsim-runtime-receipt.v1";
import {
  buildStarMapFusionGraph,
  evaluateStarSimFusionMicrophysics,
  type StarSimFusionMicrophysicsInput,
  type StarSimObjectClass,
} from "../starsim-fusion-microphysics";

const STARSIM_REPO_PATH = "shared/starsim-fusion-microphysics.ts";
const STARSIM_STAGE1_DOC = "docs/research/starsim-fusion-microphysics-stage1.md";

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeObjectClass(value: string | null): StarSimObjectClass {
  switch (value) {
    case "main_sequence":
    case "red_dwarf":
    case "red_giant":
    case "white_dwarf":
    case "neutron_star":
    case "brown_dwarf":
      return value;
    case "red_supergiant":
      return "red_giant";
    default:
      return "unknown";
  }
}

function modelModeForObjectClass(
  objectClass: StarSimObjectClass,
): StarSimFusionMicrophysicsInput["modelMode"] {
  if (objectClass === "neutron_star" || objectClass === "white_dwarf") {
    return "compact_object_glitch_proxy";
  }
  return "surface_observable_proxy";
}

function inputSummaryFromContext(context: TheoryCalculatorObjectContextV1) {
  const observables = context.observables;
  return {
    objectId: context.objectId ?? stringOrNull(observables.objectId),
    objectClass: stringOrNull(observables.objectClass),
    spectralType: stringOrNull(observables.spectralType),
    modelMode: stringOrNull(observables.modelMode),
    mass_Msun: numberOrNull(observables.mass_Msun),
    radius_Rsun: numberOrNull(observables.radius_Rsun),
    luminosity_Lsun: numberOrNull(observables.luminosity_Lsun),
    effectiveTemperature_K: numberOrNull(observables.effectiveTemperature_K),
    metallicity_feh: numberOrNull(observables.metallicity_feh),
    logg_cgs: numberOrNull(observables.logg_cgs),
    parallax_mas: numberOrNull(observables.parallax_mas),
    radialVelocity_kms: numberOrNull(observables.radialVelocity_kms),
  };
}

function buildMicrophysicsInput(context: TheoryCalculatorObjectContextV1): StarSimFusionMicrophysicsInput {
  const summary = inputSummaryFromContext(context);
  const objectClass = normalizeObjectClass(summary.objectClass);
  return {
    objectId: summary.objectId ?? context.objectId ?? "starsim-object",
    objectClass,
    observables: {
      ...(summary.spectralType ? { spectralType: summary.spectralType } : {}),
      ...(summary.luminosity_Lsun !== null ? { luminosity_Lsun: summary.luminosity_Lsun } : {}),
      ...(summary.radius_Rsun !== null ? { radius_Rsun: summary.radius_Rsun } : {}),
      ...(summary.effectiveTemperature_K !== null ? { effectiveTemperature_K: summary.effectiveTemperature_K } : {}),
      ...(summary.mass_Msun !== null ? { mass_Msun: summary.mass_Msun } : {}),
      ...(summary.metallicity_feh !== null ? { metallicity_feh: summary.metallicity_feh } : {}),
      ...(summary.logg_cgs !== null ? { logg_cgs: summary.logg_cgs } : {}),
      ...(summary.parallax_mas !== null ? { parallax_mas: summary.parallax_mas } : {}),
      ...(numberOrNull(context.observables.properMotionRa_masyr) !== null
        ? { properMotionRa_masyr: numberOrNull(context.observables.properMotionRa_masyr) as number }
        : {}),
      ...(numberOrNull(context.observables.properMotionDec_masyr) !== null
        ? { properMotionDec_masyr: numberOrNull(context.observables.properMotionDec_masyr) as number }
        : {}),
      ...(summary.radialVelocity_kms !== null ? { radialVelocity_kms: summary.radialVelocity_kms } : {}),
    },
    modelMode: modelModeForObjectClass(objectClass),
    qstUse: {
      role: "stellar_quantum_microphysics_prior",
      spacetimeCL: "proxy_only",
      quantumCL: "QCL1_entropy_stretch_proxy",
      mayPromoteToCL4: false,
    },
  };
}

export function runStarSimRuntimeBadge(args: {
  badgeId: string;
  objectContext: TheoryCalculatorObjectContextV1;
  includeRawEvaluation?: boolean;
}): StarSimRuntimeReceiptV1 {
  const inputSummary = inputSummaryFromContext(args.objectContext);
  if (args.badgeId === "starsim.runtime.build_star_map_fusion_graph") {
    const graph = buildStarMapFusionGraph([
      {
        objectId: inputSummary.objectId ?? "starsim-object",
        position_pc: [0, 0, 0],
        spectralType: inputSummary.spectralType ?? undefined,
        mass_Msun: inputSummary.mass_Msun ?? undefined,
        luminosity_Lsun: inputSummary.luminosity_Lsun ?? undefined,
        dominantFusionChannel: "none",
        quantumProcessIndex: 0,
      },
    ]);
    return buildStarSimRuntimeReceiptV1({
      badgeId: args.badgeId,
      action: "build_star_map_fusion_graph",
      inputSummary,
      outputSummary: {
        dominantFusionChannel: null,
        secondaryFusionChannels: [],
        fusionActive: null,
        effectiveTemperature_K: null,
        estimatedCoreTemperature_K: null,
        estimatedCoreDensity_g_cm3: null,
        fusionZoneMode: null,
        r10_Rstar: null,
        r50_Rstar: null,
        r90_Rstar: null,
        activeVolumeFraction: null,
        tunnelingRequired: null,
        quantumMicrophysicsRole: null,
        quantumProcessIndex: null,
        qstRole: graph.qstRole,
        spacetimeCL: "proxy_only",
        mayPromoteToCL4: false,
        blockedClaims: ["direct_er_epr_evidence", "spacetime_mechanism_claim"],
        claimIds: graph.claimIds,
        citations: graph.citations,
      },
      claimBoundaryNotes: [
        "StarMap graph output is an astrophysical population prior, not direct ER=EPR evidence.",
        "Runtime receipt is proxy_only and cannot promote to CL4.",
      ],
      caveats: [graph.caveat],
      sourceRefs: [
        { kind: "repo_module", path: STARSIM_REPO_PATH, id: "buildStarMapFusionGraph" },
        { kind: "doc", path: STARSIM_STAGE1_DOC, id: "starmap-runtime-boundary" },
      ],
      rawEvaluation: args.includeRawEvaluation ? graph : undefined,
    });
  }

  const evaluation = evaluateStarSimFusionMicrophysics(buildMicrophysicsInput(args.objectContext));
  return buildStarSimRuntimeReceiptV1({
    badgeId: args.badgeId,
    action: "evaluate_fusion_microphysics",
    inputSummary,
    outputSummary: {
      dominantFusionChannel: evaluation.inferred.dominantFusionChannel,
      secondaryFusionChannels: evaluation.inferred.secondaryFusionChannels,
      fusionActive: evaluation.inferred.fusionActive,
      effectiveTemperature_K: evaluation.inferred.effectiveTemperature_K ?? null,
      estimatedCoreTemperature_K: evaluation.inferred.estimatedCoreTemperature_K ?? null,
      estimatedCoreDensity_g_cm3: evaluation.inferred.estimatedCoreDensity_g_cm3 ?? null,
      fusionZoneMode: evaluation.fusionZone.mode,
      r10_Rstar: evaluation.fusionZone.r10_Rstar ?? null,
      r50_Rstar: evaluation.fusionZone.r50_Rstar ?? null,
      r90_Rstar: evaluation.fusionZone.r90_Rstar ?? null,
      activeVolumeFraction: evaluation.fusionZone.activeVolumeFraction ?? null,
      tunnelingRequired: evaluation.quantumMicrophysics.tunnelingRequired,
      quantumMicrophysicsRole: evaluation.quantumMicrophysics.role,
      quantumProcessIndex: evaluation.quantumMicrophysics.quantumProcessIndex,
      qstRole: evaluation.qstPrior.role,
      spacetimeCL: evaluation.qstPrior.spacetimeCL,
      mayPromoteToCL4: false,
      blockedClaims: evaluation.qstPrior.blockedClaims,
      claimIds: evaluation.evidence.claimIds,
      citations: evaluation.evidence.citations,
    },
    claimBoundaryNotes: [
      "StarSim Stage 1 is an astrophysical prior lane, not a full stellar-evolution solve.",
      "Runtime receipt is proxy_only and cannot promote to CL4.",
      "Runtime output is not direct ER=EPR evidence, propulsion evidence, or a physical mechanism confirmation.",
    ],
    caveats: evaluation.qstPrior.caveats,
    sourceRefs: [
      { kind: "repo_module", path: STARSIM_REPO_PATH, id: "evaluateStarSimFusionMicrophysics" },
      { kind: "doc", path: STARSIM_STAGE1_DOC, id: "stage1-runtime-boundary" },
      { kind: "claim_ledger", path: "shared/starsim-fusion-claims.ts", id: "STARSIM_FUSION_CLAIM_IDS" },
    ],
    rawEvaluation: args.includeRawEvaluation ? evaluation : undefined,
  });
}
