import NHM2Formal.ClaimBoundary

/-!
# NHM2 pre-experimental claim locks

This module states the deliberately narrow formal result needed by an
experiment-ready theory candidate. Even if a candidate has a diagnostically
admissible theory closure, absence of empirical receipts leaves every physical,
transport, propulsion, route-ETA, and speed claim locked. Numerical correctness
and physical realizability remain premises outside this theorem.
-/

namespace NHM2Formal

structure PreExperimentalTheoryCandidate where
  theoryClosureDiagnosticAdmissible : Prop
  empiricalReceiptsPresent : Prop
  claimLocks : ClaimLocks

end NHM2Formal

theorem nhm2_pre_experimental_claim_locks
    (candidate : NHM2Formal.PreExperimentalTheoryCandidate)
    (_theoryClosed : candidate.theoryClosureDiagnosticAdmissible)
    (_noEmpiricalReceipts : Not candidate.empiricalReceiptsPresent)
    (locksClosed : NHM2Formal.AllClaimLocksClosed candidate.claimLocks) :
    Not candidate.claimLocks.physicalViabilityClaimAllowed /\
    Not candidate.claimLocks.transportClaimAllowed /\
    Not candidate.claimLocks.routeEtaCertified /\
    Not candidate.claimLocks.propulsionClaimAllowed /\
    Not candidate.claimLocks.certifiedWarpSpeedClaimAllowed /\
    Not candidate.empiricalReceiptsPresent := by
  rcases locksClosed with ⟨physical, transport, eta, propulsion, speed⟩
  exact ⟨physical, transport, eta, propulsion, speed, _noEmpiricalReceipts⟩

#print axioms nhm2_pre_experimental_claim_locks
