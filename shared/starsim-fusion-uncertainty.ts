import { z } from "zod";
import {
  validateStarSimFusionProfile,
  type StarSimFusionProfileValidation,
} from "./starsim-fusion-profile-validation";
import type { StarSimFusionProfileImport } from "./starsim-fusion-profile-import";

export const starSimFusionUncertaintySummarySchema = z.object({
  mode: z.enum(["none", "interval", "monte_carlo_fixture"]),
  samples: z.number().int().positive().optional(),
  intervals: z.object({
    ppFraction: z.tuple([z.number(), z.number()]).optional(),
    cnoFraction: z.tuple([z.number(), z.number()]).optional(),
    tripleAlphaFraction: z.tuple([z.number(), z.number()]).optional(),
    r90_Rstar: z.tuple([z.number(), z.number()]).optional(),
    activeVolumeFraction: z.tuple([z.number(), z.number()]).optional(),
    luminosityClosureRelErr: z.tuple([z.number(), z.number()]).optional(),
  }),
  robustDominantFusionChannel: z.string().optional(),
  robustFusionZoneMode: z.string().optional(),
  caveats: z.array(z.string()),
});

export type StarSimFusionUncertaintySummary = z.infer<
  typeof starSimFusionUncertaintySummarySchema
>;

export type StarSimFusionUncertaintyPolicy = {
  mode: "none" | "interval" | "monte_carlo_fixture";
  samples?: number;
  seed?: number;
  perturb:
    | "observables_only"
    | "profile_shells_only"
    | "observables_and_profile_shells";
};

export function summarizeStarSimFusionUncertainty(
  profile: StarSimFusionProfileImport,
  policy: StarSimFusionUncertaintyPolicy,
): StarSimFusionUncertaintySummary {
  if (policy.mode === "none") {
    return starSimFusionUncertaintySummarySchema.parse({
      mode: "none",
      intervals: {},
      caveats: ["No uncertainty propagation was requested."],
    });
  }

  const samples =
    policy.mode === "interval" ? 2 : Math.max(2, Math.min(200, policy.samples ?? 16));
  const validations: StarSimFusionProfileValidation[] = [];
  let rng = lcg(policy.seed ?? 1);
  for (let i = 0; i < samples; i += 1) {
    const factor =
      policy.mode === "interval" ? (i === 0 ? 0.95 : 1.05) : 0.95 + rng() * 0.1;
    validations.push(validateStarSimFusionProfile(perturbProfile(profile, factor, policy)));
  }

  const channelCounts = count(validations.map((item) => item.integratedFusion.dominantFusionChannel));
  const zoneCounts = count(validations.map((item) => item.fusionZone.mode));
  const robustDominantFusionChannel = top(channelCounts);
  const robustFusionZoneMode = top(zoneCounts);
  const caveats = ["Uncertainty propagation uses fixture perturbations, not full stellar-evolution reruns."];
  if (Object.keys(channelCounts).length > 1) caveats.push("Dominant channel is unstable under perturbation.");

  return starSimFusionUncertaintySummarySchema.parse({
    mode: policy.mode,
    samples,
    intervals: {
      ppFraction: interval(validations.map((item) => item.integratedFusion.ppFraction)),
      cnoFraction: interval(validations.map((item) => item.integratedFusion.cnoFraction)),
      tripleAlphaFraction: interval(
        validations.map((item) => item.integratedFusion.tripleAlphaFraction),
      ),
      r90_Rstar: interval(validations.map((item) => item.fusionZone.r90_Rstar)),
      activeVolumeFraction: interval(
        validations.map((item) => item.fusionZone.activeVolumeFraction),
      ),
      luminosityClosureRelErr: interval(
        validations.map((item) => item.integratedFusion.luminosityClosureRelErr),
      ),
    },
    robustDominantFusionChannel,
    robustFusionZoneMode,
    caveats,
  });
}

function perturbProfile(
  profile: StarSimFusionProfileImport,
  factor: number,
  policy: StarSimFusionUncertaintyPolicy,
): StarSimFusionProfileImport {
  const perturbObservables =
    policy.perturb === "observables_only" ||
    policy.perturb === "observables_and_profile_shells";
  const perturbShells =
    policy.perturb === "profile_shells_only" ||
    policy.perturb === "observables_and_profile_shells";
  return {
    ...profile,
    global: {
      ...profile.global,
      luminosity_Lsun:
        perturbObservables && profile.global.luminosity_Lsun
          ? profile.global.luminosity_Lsun * factor
          : profile.global.luminosity_Lsun,
    },
    shells: profile.shells.map((shell, index) => {
      const shellFactor = perturbShells ? factor * (1 + index * 0.01) : 1;
      return {
        ...shell,
        epsNuc_erg_g_s: shell.epsNuc_erg_g_s
          ? shell.epsNuc_erg_g_s * shellFactor
          : shell.epsNuc_erg_g_s,
        epsPp_erg_g_s: shell.epsPp_erg_g_s
          ? shell.epsPp_erg_g_s * shellFactor
          : shell.epsPp_erg_g_s,
        epsCno_erg_g_s: shell.epsCno_erg_g_s
          ? shell.epsCno_erg_g_s * shellFactor
          : shell.epsCno_erg_g_s,
        epsTripleAlpha_erg_g_s: shell.epsTripleAlpha_erg_g_s
          ? shell.epsTripleAlpha_erg_g_s * shellFactor
          : shell.epsTripleAlpha_erg_g_s,
      };
    }),
  };
}

function interval(values: Array<number | undefined>) {
  const finite = values.filter((value): value is number => Number.isFinite(value));
  if (finite.length === 0) return undefined;
  return [Math.min(...finite), Math.max(...finite)] as [number, number];
}

function count(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function top(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
