/-!
# NHM2 claim-boundary skeleton

This module formalizes the first policy layer around the NHM2 campaign pass.
It intentionally does not formalize the floating-point GR/tensor computation.
Instead, it proves that campaign admission, clocking replay, scalar closure,
or component authority do not by themselves open physical / transport claims.
-/

namespace NHM2Formal

inductive ClaimTier where
  | diagnostic
  | reducedOrderCandidate
  | physicalViability
  | transport
deriving DecidableEq, Repr

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

structure CampaignEvidence where
  sourceIndependencePass : Prop
  switchingConservationPass : Prop
  frequencyConvergencePass : Prop
  dynamicGeometryAgreementPass : Prop
  fullRegionalTensorClosurePass : Prop
  observerFamilyPass : Prop
  qeiReceiptsPass : Prop
  stabilityPass : Prop

def DiagnosticCampaignPass (evidence : CampaignEvidence) : Prop :=
  evidence.sourceIndependencePass /\
  evidence.switchingConservationPass /\
  evidence.frequencyConvergencePass /\
  evidence.dynamicGeometryAgreementPass /\
  evidence.fullRegionalTensorClosurePass /\
  evidence.observerFamilyPass /\
  evidence.qeiReceiptsPass /\
  evidence.stabilityPass

theorem diagnosticCampaignPass_does_not_open_claim_locks
    (evidence : CampaignEvidence)
    (locks : ClaimLocks)
    (_campaignPass : DiagnosticCampaignPass evidence)
    (locksClosed : AllClaimLocksClosed locks) :
    Not locks.physicalViabilityClaimAllowed /\
    Not locks.transportClaimAllowed /\
    Not locks.routeEtaCertified /\
    Not locks.propulsionClaimAllowed /\
    Not locks.certifiedWarpSpeedClaimAllowed := by
  exact locksClosed

structure ClockingProfile where
  alphaCenterline : Rat
  coordinateTimeSeconds : Rat
  shipProperTimeSeconds : Rat

def ProperTimeByLapse (profile : ClockingProfile) : Rat :=
  profile.alphaCenterline * profile.coordinateTimeSeconds

def ClockingLawHolds (profile : ClockingProfile) : Prop :=
  profile.shipProperTimeSeconds = ProperTimeByLapse profile

theorem clockingLaw_does_not_certify_route_or_speed
    (profile : ClockingProfile)
    (locks : ClaimLocks)
    (_clocking : ClockingLawHolds profile)
    (locksClosed : AllClaimLocksClosed locks) :
    Not locks.routeEtaCertified /\ Not locks.certifiedWarpSpeedClaimAllowed := by
  exact And.intro locksClosed.2.2.1 locksClosed.2.2.2.2

structure TensorClosureEvidence where
  t00UnderTolerance : Prop
  fullTensorClosurePass : Prop

theorem t00Closure_does_not_imply_fullTensorClosure
    (evidence : TensorClosureEvidence)
    (fullTensorMissing : Not evidence.fullTensorClosurePass) :
    evidence.t00UnderTolerance -> Not evidence.fullTensorClosurePass := by
  intro _t00
  exact fullTensorMissing

structure ObserverEvidence where
  eulerianPass : Prop
  robustObserverFamilyPass : Prop
  continuousOptimizerImplemented : Prop

theorem eulerianOnly_does_not_imply_robustObserverPass
    (evidence : ObserverEvidence)
    (robustMissing : Not evidence.robustObserverFamilyPass) :
    evidence.eulerianPass -> Not evidence.robustObserverFamilyPass := by
  intro _eulerian
  exact robustMissing

structure SourceAuthorityEvidence where
  componentAuthorityComplete : Prop
  materialCredibilityPass : Prop
  targetEchoDetected : Prop

theorem sourceComponentAuthority_does_not_imply_materialCredibility
    (evidence : SourceAuthorityEvidence)
    (materialMissing : Not evidence.materialCredibilityPass) :
    evidence.componentAuthorityComplete -> Not evidence.materialCredibilityPass := by
  intro _authority
  exact materialMissing

theorem targetEcho_blocks_sourceAuthority
    (evidence : SourceAuthorityEvidence)
    (echoBlocks : evidence.targetEchoDetected -> Not evidence.componentAuthorityComplete) :
    evidence.targetEchoDetected -> Not evidence.componentAuthorityComplete := by
  exact echoBlocks

end NHM2Formal
