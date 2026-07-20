/-!
# NHM2 experiment-ready formal replay driver

This driver is intentionally standalone: it has no project imports and requires
no prebuilt project `.olean` files. A pinned Lean executable can therefore check
the pre-experimental claim-lock theorem directly from these sealed bytes. It
proves no numerical or physical NHM2 claim.
-/

namespace NHM2StandaloneReplay

structure ClaimLocks where
  physicalViabilityClaimAllowed : Prop
  transportClaimAllowed : Prop
  routeEtaCertified : Prop
  propulsionClaimAllowed : Prop
  certifiedWarpSpeedClaimAllowed : Prop

def AllClaimLocksClosed (locks : ClaimLocks) : Prop :=
  Not locks.physicalViabilityClaimAllowed /\
  Not locks.transportClaimAllowed /\
  Not locks.routeEtaCertified /\
  Not locks.propulsionClaimAllowed /\
  Not locks.certifiedWarpSpeedClaimAllowed

structure PreExperimentalTheoryCandidate where
  theoryClosureDiagnosticAdmissible : Prop
  empiricalReceiptsPresent : Prop
  claimLocks : ClaimLocks

end NHM2StandaloneReplay

theorem nhm2_pre_experimental_claim_locks
    (candidate : NHM2StandaloneReplay.PreExperimentalTheoryCandidate)
    (_theoryClosed : candidate.theoryClosureDiagnosticAdmissible)
    (_noEmpiricalReceipts : Not candidate.empiricalReceiptsPresent)
    (locksClosed : NHM2StandaloneReplay.AllClaimLocksClosed candidate.claimLocks) :
    Not candidate.claimLocks.physicalViabilityClaimAllowed /\
    Not candidate.claimLocks.transportClaimAllowed /\
    Not candidate.claimLocks.routeEtaCertified /\
    Not candidate.claimLocks.propulsionClaimAllowed /\
    Not candidate.claimLocks.certifiedWarpSpeedClaimAllowed /\
    Not candidate.empiricalReceiptsPresent := by
  constructor
  · exact locksClosed.1
  constructor
  · exact locksClosed.2.1
  constructor
  · exact locksClosed.2.2.1
  constructor
  · exact locksClosed.2.2.2.1
  constructor
  · exact locksClosed.2.2.2.2
  · exact _noEmpiricalReceipts

#check nhm2_pre_experimental_claim_locks
#print axioms nhm2_pre_experimental_claim_locks

#eval IO.println "NHM2_FORMAL_THEOREM nhm2_pre_experimental_claim_locks PROVED"
