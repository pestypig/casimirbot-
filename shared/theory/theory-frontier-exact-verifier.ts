import {
  isTheoryFrontierCandidateV1,
  type TheoryFrontierCandidateV1,
} from "../contracts/theory-frontier-candidate.v1";
import {
  buildTheoryFrontierExactContractVerificationV1,
  type TheoryFrontierExactContractVerificationV1,
} from "../contracts/theory-frontier-exact-contract-verification.v1";

function hasEquationOrVariableMapping(candidate: TheoryFrontierCandidateV1): boolean {
  return (
    candidate.congruence.sharedSymbols.length > 0 ||
    candidate.congruence.sharedEquationFamilies.length > 0 ||
    candidate.congruence.symbolCompatibilityScore > 0 ||
    candidate.congruence.equationFamilyCompatibilityScore > 0
  );
}

export function verifyTheoryFrontierCandidateExactContract(
  candidate: unknown,
): TheoryFrontierExactContractVerificationV1 {
  const issues: string[] = [];
  const validCandidateContract = isTheoryFrontierCandidateV1(candidate);
  if (!validCandidateContract) {
    issues.push("candidate must satisfy theory_frontier_candidate/v1");
  }

  const typedCandidate = validCandidateContract ? candidate : null;
  const completeFirstPrinciplesPath = Boolean(
    typedCandidate &&
      typedCandidate.congruence.firstPrinciplesPathBadgeIds.length > 0 &&
      typedCandidate.congruence.sharedFirstPrincipleBadgeIds.length > 0,
  );
  const dimensionalChecks = Boolean(
    typedCandidate &&
      typedCandidate.congruence.unitCompatibility !== "incompatible" &&
      typedCandidate.congruence.dimensionalIssues.length === 0,
  );
  const equationAndVariableMappings = Boolean(typedCandidate && hasEquationOrVariableMapping(typedCandidate));
  const requiredObservables = Boolean(typedCandidate && typedCandidate.congruence.requiredObservables.length > 0);
  const uncertaintyBudget = Boolean(typedCandidate && typedCandidate.congruence.uncertaintyBudget.length > 0);
  const falsificationChecks = Boolean(typedCandidate && typedCandidate.congruence.falsificationChecks.length > 0);
  const evidenceProvenance = Boolean(
    typedCandidate &&
      typedCandidate.congruence.sourceReferences.length > 0 &&
      typedCandidate.replay.evidenceReferenceIds.length > 0,
  );
  const activeClaimBoundaries = Boolean(typedCandidate && typedCandidate.congruence.claimBoundaryNotes.length > 0);
  const nonTerminalBoundary = Boolean(
    typedCandidate &&
      typedCandidate.claimBoundary.validatesTheory === false &&
      typedCandidate.claimBoundary.solvesPhysicalMechanism === false &&
      typedCandidate.claimBoundary.promotionAllowed === false &&
      typedCandidate.claimBoundary.terminalEligible === false &&
      typedCandidate.claimBoundary.assistantAnswer === false &&
      typedCandidate.claimBoundary.probabilityMeans === "placement_uncertainty_not_truth_probability" &&
      typedCandidate.literaturePolicy.noAutoPromoteLiterature === true,
  );

  if (!completeFirstPrinciplesPath) issues.push("missing complete first-principles path");
  if (!dimensionalChecks) issues.push("dimensional checks are incomplete or incompatible");
  if (!equationAndVariableMappings) issues.push("missing equation or variable mappings");
  if (!requiredObservables) issues.push("missing required observables");
  if (!uncertaintyBudget) issues.push("missing uncertainty budget");
  if (!falsificationChecks) issues.push("missing falsification checks");
  if (!evidenceProvenance) issues.push("missing evidence provenance");
  if (!activeClaimBoundaries) issues.push("missing active claim boundaries");
  if (!nonTerminalBoundary) issues.push("non-terminal and no-promotion boundary is not intact");

  return buildTheoryFrontierExactContractVerificationV1({
    candidateId: typedCandidate?.candidateId ?? null,
    exactContractSatisfied:
      validCandidateContract &&
      completeFirstPrinciplesPath &&
      dimensionalChecks &&
      equationAndVariableMappings &&
      requiredObservables &&
      uncertaintyBudget &&
      falsificationChecks &&
      evidenceProvenance &&
      activeClaimBoundaries &&
      nonTerminalBoundary,
    issues,
    checkedRequirements: {
      validCandidateContract,
      completeFirstPrinciplesPath,
      dimensionalChecks,
      equationAndVariableMappings,
      requiredObservables,
      uncertaintyBudget,
      falsificationChecks,
      evidenceProvenance,
      activeClaimBoundaries,
      nonTerminalBoundary,
    },
  });
}
