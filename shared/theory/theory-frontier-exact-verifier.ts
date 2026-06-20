import {
  isTheoryFrontierCandidateV1,
  type TheoryFrontierCandidateV1,
} from "../contracts/theory-frontier-candidate.v1";
import {
  buildTheoryFrontierExactContractVerificationV1,
  type TheoryFrontierExactContractRequirementDetailV1,
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

function requirementDetail(args: {
  requirement: TheoryFrontierExactContractRequirementDetailV1["requirement"];
  passed: boolean;
  evidenceRefs: string[];
  notes: string[];
}): TheoryFrontierExactContractRequirementDetailV1 {
  return {
    requirement: args.requirement,
    status: args.passed ? "passed" : "failed",
    evidenceRefs: [...new Set(args.evidenceRefs.filter(Boolean))].sort(),
    notes: [...new Set(args.notes.filter(Boolean))].sort(),
  };
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

  const requirementDetails: TheoryFrontierExactContractRequirementDetailV1[] = [
    requirementDetail({
      requirement: "validCandidateContract",
      passed: validCandidateContract,
      evidenceRefs: typedCandidate ? [typedCandidate.candidateId] : [],
      notes: [validCandidateContract ? "candidate satisfies theory_frontier_candidate/v1" : "candidate contract validation failed"],
    }),
    requirementDetail({
      requirement: "completeFirstPrinciplesPath",
      passed: completeFirstPrinciplesPath,
      evidenceRefs: typedCandidate?.congruence.firstPrinciplesPathBadgeIds ?? [],
      notes: [
        `shared_first_principles=${typedCandidate?.congruence.sharedFirstPrincipleBadgeIds.length ?? 0}`,
        `path_badges=${typedCandidate?.congruence.firstPrinciplesPathBadgeIds.length ?? 0}`,
      ],
    }),
    requirementDetail({
      requirement: "dimensionalChecks",
      passed: dimensionalChecks,
      evidenceRefs: typedCandidate?.congruence.sharedUnitSignatures ?? [],
      notes: [
        `unitCompatibility=${typedCandidate?.congruence.unitCompatibility ?? "unknown"}`,
        `dimensionalIssues=${typedCandidate?.congruence.dimensionalIssues.length ?? 0}`,
      ],
    }),
    requirementDetail({
      requirement: "equationAndVariableMappings",
      passed: equationAndVariableMappings,
      evidenceRefs: [
        ...(typedCandidate?.congruence.sharedSymbols ?? []),
        ...(typedCandidate?.congruence.sharedEquationFamilies ?? []),
      ],
      notes: [
        `symbolCompatibilityScore=${typedCandidate?.congruence.symbolCompatibilityScore ?? 0}`,
        `equationFamilyCompatibilityScore=${typedCandidate?.congruence.equationFamilyCompatibilityScore ?? 0}`,
      ],
    }),
    requirementDetail({
      requirement: "requiredObservables",
      passed: requiredObservables,
      evidenceRefs: typedCandidate?.congruence.requiredObservables ?? [],
      notes: [`requiredObservables=${typedCandidate?.congruence.requiredObservables.length ?? 0}`],
    }),
    requirementDetail({
      requirement: "uncertaintyBudget",
      passed: uncertaintyBudget,
      evidenceRefs: typedCandidate?.congruence.uncertaintyBudget ?? [],
      notes: [`uncertaintyBudgetItems=${typedCandidate?.congruence.uncertaintyBudget.length ?? 0}`],
    }),
    requirementDetail({
      requirement: "falsificationChecks",
      passed: falsificationChecks,
      evidenceRefs: typedCandidate?.congruence.falsificationChecks ?? [],
      notes: [`falsificationChecks=${typedCandidate?.congruence.falsificationChecks.length ?? 0}`],
    }),
    requirementDetail({
      requirement: "evidenceProvenance",
      passed: evidenceProvenance,
      evidenceRefs: [
        ...(typedCandidate?.replay.evidenceReferenceIds ?? []),
        ...(typedCandidate?.congruence.sourceReferences.map((sourceRef) =>
          [sourceRef.kind, sourceRef.path ?? "", sourceRef.id ?? ""].filter(Boolean).join(":"),
        ) ?? []),
      ],
      notes: [
        `sourceReferences=${typedCandidate?.congruence.sourceReferences.length ?? 0}`,
        `replayEvidenceReferenceIds=${typedCandidate?.replay.evidenceReferenceIds.length ?? 0}`,
      ],
    }),
    requirementDetail({
      requirement: "activeClaimBoundaries",
      passed: activeClaimBoundaries,
      evidenceRefs: typedCandidate?.congruence.claimBoundaryNotes ?? [],
      notes: [`claimBoundaryNotes=${typedCandidate?.congruence.claimBoundaryNotes.length ?? 0}`],
    }),
    requirementDetail({
      requirement: "nonTerminalBoundary",
      passed: nonTerminalBoundary,
      evidenceRefs: typedCandidate ? [typedCandidate.candidateId] : [],
      notes: [
        `validatesTheory=${String(typedCandidate?.claimBoundary.validatesTheory ?? null)}`,
        `solvesPhysicalMechanism=${String(typedCandidate?.claimBoundary.solvesPhysicalMechanism ?? null)}`,
        `promotionAllowed=${String(typedCandidate?.claimBoundary.promotionAllowed ?? null)}`,
        `terminalEligible=${String(typedCandidate?.claimBoundary.terminalEligible ?? null)}`,
        `assistantAnswer=${String(typedCandidate?.claimBoundary.assistantAnswer ?? null)}`,
      ],
    }),
  ];

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
    requirementDetails,
  });
}
