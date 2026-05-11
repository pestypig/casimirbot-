import type { StarSimFusionProfileValidation } from "./starsim-fusion-profile-validation";
import type { StarSimFusionUncertaintySummary } from "./starsim-fusion-uncertainty";
import type { StarSimFusionBenchmarkBlocker } from "./starsim-fusion-benchmark-runner";

export type StarSimFusionBenchmarkVerdict =
  | "not_tested"
  | "fixture_only_profile_support"
  | "reduced_order_profile_support"
  | "mesa_import_benchmark_support"
  | "externally_reproduced_benchmark_support"
  | "stage2_candidate_ready"
  | "stage2_candidate_blocked"
  | "overclaim_blocked";

export function determineStarSimFusionBenchmarkVerdict(args: {
  profileResults: StarSimFusionProfileValidation[];
  blockers: StarSimFusionBenchmarkBlocker[];
  uncertainty: StarSimFusionUncertaintySummary[];
}): StarSimFusionBenchmarkVerdict {
  if (args.profileResults.length === 0) return "not_tested";
  if (
    args.blockers.some(
      (blocker) =>
        blocker.blockerId === "direct_er_epr_overclaim" ||
        blocker.blockerId === "qst_cl_promotion_attempt" ||
        blocker.blockerId === "h_spectral_fit_overclaim",
    )
  ) {
    return "overclaim_blocked";
  }
  if (args.blockers.length > 0) return "stage2_candidate_blocked";

  const statuses = new Set(
    args.profileResults.map((item) => item.importedProfileSummary.reproducibilityStatus),
  );
  const hasUncertainty = args.uncertainty.every((item) => item.mode !== "none");
  const hasRequiredFields = args.profileResults.every(
    (item) =>
      item.integratedFusion.dominantFusionChannel &&
      item.fusionZone.r90_Rstar !== undefined &&
      item.evidence.claimIds.length > 0 &&
      item.evidence.citations.length > 0,
  );
  if (hasUncertainty && hasRequiredFields && statuses.has("externally_reproduced")) {
    return "stage2_candidate_ready";
  }
  if (statuses.has("mesa_imported")) return "mesa_import_benchmark_support";
  if (statuses.has("externally_reproduced")) return "externally_reproduced_benchmark_support";
  if (statuses.has("reduced_order_simulated")) return "reduced_order_profile_support";
  return "fixture_only_profile_support";
}
