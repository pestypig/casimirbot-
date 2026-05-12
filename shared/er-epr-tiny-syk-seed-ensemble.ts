import type { TinySykPlan } from "./er-epr-tiny-syk";

export type TinySykSeedEnsembleInput = {
  planId: string;
  createdAt: string;
  seeds: number[];
  nMajoranasPerSide: Array<4 | 6 | 8>;
  betaValues: number[];
  couplingMuValues: number[];
};

export function buildTinySykSeedEnsemble(input: TinySykSeedEnsembleInput): TinySykPlan[] {
  if (input.seeds.length === 0) throw new Error("Tiny SYK validation requires at least one seed");
  const plans: TinySykPlan[] = [];
  for (const seed of input.seeds) {
    for (const nMajoranas of input.nMajoranasPerSide) {
      for (const beta of input.betaValues) {
        for (const mu of input.couplingMuValues) {
          plans.push({
            schemaVersion: "er-epr-tiny-syk-plan.v1",
            planId: `${input.planId}:seed-${seed}:n-${nMajoranas}:beta-${beta}:mu-${mu}`,
            createdAt: input.createdAt,
            backend: "two_sided_syk_tiny_exact_diag",
            model: {
              nMajoranasPerSide: nMajoranas,
              qBodyOrder: 4,
              beta,
              seed,
              coupling: {
                mu,
                sign: "correct",
                couplingTime: 0.5,
                couplingWindow: 0.2,
              },
              protocol: {
                injectionTime: 0,
                extractionTime: 1,
                timeGrid: [0, 0.25, 0.5, 0.75, 1],
              },
              statePreparation: "thermofield_double_approx",
            },
            controls: {
              includeWrongSign: true,
              includeNoCoupling: true,
              includeDisentangled: true,
              includeShuffledHamiltonian: true,
              includeRandomMatrix: true,
              includeSpinChain: true,
            },
            entropySweep: {
              enabled: true,
              deltaS_nats: [0, 1, 2],
            },
            claimBoundary: {
              spacetimeCL: "proxy_only",
              mayPromoteToCL4: false,
              claimTier: "Stage1_model_internal_toy_solver",
            },
          });
        }
      }
    }
  }
  return plans;
}
