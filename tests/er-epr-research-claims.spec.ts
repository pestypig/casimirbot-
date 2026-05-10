import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  evaluateErEprSimulation,
  type ErEprSimulationInput,
} from "../shared/er-epr-simulation";
import { ER_EPR_STAGE1_CLAIM_IDS } from "../shared/er-epr-research-claims";

const passingInput: ErEprSimulationInput = {
  modelFamily: "two_sided_SYK",
  nQubitsOrModes: 12,
  temperatureRegime: "low",
  initialState: "thermofield_double",
  coupling: "double_trace_correct_sign",
  probeInsertionTime: -4,
  measurementWindow: 8,
  entropyStretch: { deltaS_nats: 0 },
  observables: {
    mutualInformation: 1.8,
    entanglementEntropy_nats: 3.2,
    teleportationFidelity: 0.86,
    causalOrderingScore: 0.84,
    timeDelayScore: 0.82,
    operatorSizeWindingScore: 0.85,
    scramblingScore: 0.83,
    thermalizationScore: 0.84,
    entropyAreaProxyTrackingScore: 0.86,
    ordinaryTeleportationControlScore: 0.12,
    shuffledHamiltonianControlScore: 0.18,
    disentangledControlScore: 0.1,
    wrongSignCouplingControlScore: 0.14,
  },
};

type ClaimRegistry = {
  claims: Array<{
    claimId: string;
    sources: Array<{ citation: string; url?: string; note?: string }>;
  }>;
};

function loadClaimRegistry(): ClaimRegistry {
  const registryPath = path.resolve(
    process.cwd(),
    "docs",
    "knowledge",
    "math-claims",
    "er-epr-stage1-simulation.claims.json",
  );
  return JSON.parse(fs.readFileSync(registryPath, "utf8")) as ClaimRegistry;
}

const registryClaimIds = new Set(loadClaimRegistry().claims.map((claim) => claim.claimId));

describe("ER=EPR Stage 1 research claim provenance", () => {
  it("returns non-empty claim IDs for each reachable ER_EPR_STAGE1_SIM verdict", () => {
    const cases = [
      evaluateErEprSimulation(passingInput),
      evaluateErEprSimulation({
        ...passingInput,
        observables: {
          ...passingInput.observables,
          teleportationFidelity: 0.75,
          causalOrderingScore: 0.75,
          timeDelayScore: 0.75,
          operatorSizeWindingScore: 0.75,
          scramblingScore: 0.75,
          thermalizationScore: 0.75,
          entropyAreaProxyTrackingScore: 0.75,
        },
      }),
      evaluateErEprSimulation({
        ...passingInput,
        observables: {
          ...passingInput.observables,
          shuffledHamiltonianControlScore: 0.71,
        },
      }),
      evaluateErEprSimulation({
        ...passingInput,
        modelFamily: "random_matrix_control",
        initialState: "random_control",
        coupling: "none",
        starSim: {
          role: "cosmological_structure_prior",
          clusteringEntropy_nats: 3,
        },
      }),
      evaluateErEprSimulation({
        ...passingInput,
        requestedSpacetimeCL: "CL4",
      }),
    ];

    expect(new Set(cases.map((evaluation) => evaluation.evidence.verdict))).toEqual(
      new Set([
        "dual_model_support_strong",
        "model_internal_er_epr_support",
        "ordinary_control_explains_signal",
        "proxy_only_structure_prior",
        "overclaim_blocked",
      ]),
    );
    for (const evaluation of cases) {
      expect(evaluation.evidence.claimIds.length).toBeGreaterThan(0);
      expect(evaluation.evidence.uncertaintyNotes.length).toBe(evaluation.evidence.claimIds.length);
      expect(Object.keys(evaluation.evidence.sourceRoles)).toEqual(
        expect.arrayContaining(evaluation.evidence.claimIds),
      );
    }
  });

  it("only returns claim IDs that exist in the claim registry", () => {
    const evaluations = [
      evaluateErEprSimulation(passingInput),
      evaluateErEprSimulation({ ...passingInput, requestedSpacetimeCL: "CL4" }),
      evaluateErEprSimulation({
        ...passingInput,
        entropyStretch: { deltaS_nats: Math.log(100) },
      }),
      evaluateErEprSimulation({
        ...passingInput,
        starSim: {
          role: "direct_er_epr_evidence",
          clusteringEntropy_nats: 4,
        },
      }),
    ];

    for (const evaluation of evaluations) {
      for (const claimId of evaluation.evidence.claimIds) {
        expect(registryClaimIds.has(claimId)).toBe(true);
      }
    }
  });

  it("does not use placeholder citations in the claim registry", () => {
    const registry = loadClaimRegistry();
    const placeholder = /\b(TODO|TBD|placeholder|unknown|citation needed)\b/i;

    for (const claim of registry.claims) {
      expect(claim.sources.length).toBeGreaterThan(0);
      for (const source of claim.sources) {
        expect(source.citation).not.toMatch(placeholder);
        expect(source.url ?? "").not.toMatch(placeholder);
        expect(source.note ?? "").not.toMatch(placeholder);
      }
    }
  });

  it("keeps StarSim direct ER=EPR evidence blocked with the StarSim boundary claim", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      starSim: {
        role: "direct_er_epr_evidence",
        clusteringEntropy_nats: 4,
        localDensityContrast: 1.2,
      },
    });

    expect(evaluation.evidence.verdict).toBe("overclaim_blocked");
    expect(evaluation.guards.blockedClaims).toContain("astrometric_prior_as_direct_er_epr_evidence");
    expect(evaluation.evidence.claimIds).toContain(
      ER_EPR_STAGE1_CLAIM_IDS.starsimAstrometryStructurePriorOnly,
    );
  });

  it("keeps CL promotion blocked with model-boundary claims", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      requestedSpacetimeCL: "CL4",
    });

    expect(evaluation.evidence.verdict).toBe("overclaim_blocked");
    expect(evaluation.evidence.claimIds).toEqual(
      expect.arrayContaining([
        ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext,
        ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy,
        ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel,
      ]),
    );
  });

  it("strong support includes both the processor precedent and critique guardrail claims", () => {
    const evaluation = evaluateErEprSimulation(passingInput);

    expect(evaluation.evidence.verdict).toBe("dual_model_support_strong");
    expect(evaluation.evidence.claimIds).toEqual(
      expect.arrayContaining([
        ER_EPR_STAGE1_CLAIM_IDS.sykProcessorSimulationPrecedent,
        ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail,
      ]),
    );
  });

  it("high entropy stretch demotes the signal with the entropy-stretch claim", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      entropyStretch: { deltaS_nats: Math.log(100) },
    });

    expect(evaluation.gates.entropyVisibilityPass).toBe(false);
    expect(evaluation.evidence.verdict).toBe("ordinary_control_explains_signal");
    expect(evaluation.evidence.claimIds).toContain(
      ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims,
    );
  });
});
