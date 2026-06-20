import { describe, expect, it } from "vitest";

import {
  buildTheoryFrontierExactContractVerificationV1,
  isTheoryFrontierExactContractVerificationV1,
  validateTheoryFrontierExactContractVerificationV1,
} from "../theory-frontier-exact-contract-verification.v1";

const checkedRequirements = {
  validCandidateContract: true,
  completeFirstPrinciplesPath: true,
  dimensionalChecks: true,
  equationAndVariableMappings: true,
  requiredObservables: true,
  uncertaintyBudget: true,
  falsificationChecks: true,
  evidenceProvenance: true,
  activeClaimBoundaries: true,
  nonTerminalBoundary: true,
};

describe("theory frontier exact contract verification v1", () => {
  it("builds a valid non-terminal exact contract verification artifact", () => {
    const verification = buildTheoryFrontierExactContractVerificationV1({
      candidateId: "frontier:test",
      exactContractSatisfied: true,
      issues: [],
      checkedRequirements,
    });

    expect(verification).toMatchObject({
      artifactId: "theory_frontier_exact_contract_verification",
      schemaVersion: "theory_frontier_exact_contract_verification/v1",
      verifierVersion: "theory_frontier_exact_contract/v1",
      candidateId: "frontier:test",
      exactContractSatisfied: true,
      promotionAllowed: false,
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(validateTheoryFrontierExactContractVerificationV1(verification)).toEqual([]);
    expect(isTheoryFrontierExactContractVerificationV1(verification)).toBe(true);
  });

  it("rejects artifacts that grant promotion or terminal authority", () => {
    const verification = buildTheoryFrontierExactContractVerificationV1({
      candidateId: "frontier:test",
      exactContractSatisfied: false,
      issues: ["missing required observables"],
      checkedRequirements: {
        ...checkedRequirements,
        requiredObservables: false,
      },
    });
    const unsafe = {
      ...verification,
      promotionAllowed: true,
      validatesTheory: true,
      solvesPhysicalMechanism: true,
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
    };

    expect(validateTheoryFrontierExactContractVerificationV1(unsafe)).toEqual(
      expect.arrayContaining([
        "promotionAllowed must be false",
        "validatesTheory must be false",
        "solvesPhysicalMechanism must be false",
        "assistant_answer must be false",
        "terminal_eligible must be false",
        "raw_content_included must be false",
      ]),
    );
  });

  it("rejects satisfied exact contracts with failed checks or open issues", () => {
    const inconsistent = buildTheoryFrontierExactContractVerificationV1({
      candidateId: "frontier:test",
      exactContractSatisfied: true,
      issues: ["missing evidence provenance"],
      checkedRequirements: {
        ...checkedRequirements,
        evidenceProvenance: false,
      },
    });

    expect(validateTheoryFrontierExactContractVerificationV1(inconsistent)).toEqual(
      expect.arrayContaining([
        "exactContractSatisfied requires every checked requirement to be true",
        "exactContractSatisfied requires issues to be empty",
      ]),
    );
    expect(isTheoryFrontierExactContractVerificationV1(inconsistent)).toBe(false);
  });
});
