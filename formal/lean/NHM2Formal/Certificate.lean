import NHM2Formal.ClaimBoundary

/-!
# NHM2 certificate-backed campaign verification

This module checks the shape of a reduced-order campaign certificate. Runtime
code emits exact rational bounds and booleans from JSON artifacts; Lean verifies
that those facts imply diagnostic campaign admissibility while claim locks stay
closed.
-/

namespace NHM2Formal

structure CampaignCertificate where
  selectedProfileId : String
  profileMatchesExpected : Bool
  chartMatchesCampaign : Bool
  artifactHashesPresent : Bool
  atlasHashMatches : Bool
  hasT00 : Bool
  hasT0i : Bool
  hasDiagonalTij : Bool
  hasOffDiagonalTij : Bool
  fullTensorClosurePass : Bool
  maxRegionalResidual : Rat
  regionalResidualTolerance : Rat
  independentlyDerivedTileMaterialTensor : Bool
  copiedFromMetricRequiredTensor : Bool
  fittedToMetricResidual : Bool
  targetEchoDetected : Bool
  sourceIndependencePass : Bool
  switchingConservationPass : Bool
  covariantConservationPass : Bool
  conservationResidualLInf : Rat
  conservationToleranceLInf : Rat
  frequencyConvergencePass : Bool
  frequencyFixedCycleAverageSource : Bool
  frequencyMaxResidualLInf : Rat
  frequencyToleranceLInf : Rat
  dynamicGeometryAgreementPass : Bool
  dynamicCycleAverageSourceFixed : Bool
  dynamicResidualLInf : Rat
  dynamicResidualBoundLInf : Rat
  observerFamilyPass : Bool
  eulerianOnly : Bool
  robustCheckComplete : Bool
  anyObserverViolation : Bool
  hasNonEulerianFamilyPass : Bool
  wecReceipt : Bool
  necReceipt : Bool
  decReceipt : Bool
  secReceipt : Bool
  qeiReceiptsPass : Bool
  hasWallWorldline : Bool
  qeiDossierComplete : Bool
  qeiAllMarginsPass : Bool
  qeiAnyProxy : Bool
  qeiMinMarginSI : Rat
  qeiMarginBoundSI : Rat
  stabilityPass : Bool
  horizonPass : Bool
  blueshiftPass : Bool
  particleAccumulationPass : Bool
  perturbativeStabilityPass : Bool
  alphaCenterline : Rat
  coordinateTimeSeconds : Rat
  shipProperTimeSeconds : Rat
  routeEtaCertified : Bool
  physicalViabilityClaimAllowed : Bool
  transportClaimAllowed : Bool
  routeEtaClaimAllowed : Bool
  propulsionClaimAllowed : Bool
  certifiedWarpSpeedClaimAllowed : Bool

def CampaignCertificateBoundsPassBool (certificate : CampaignCertificate) : Bool :=
  decide (certificate.maxRegionalResidual <= certificate.regionalResidualTolerance) &&
  decide (certificate.conservationResidualLInf <= certificate.conservationToleranceLInf) &&
  decide (certificate.frequencyMaxResidualLInf <= certificate.frequencyToleranceLInf) &&
  decide (certificate.dynamicResidualLInf <= certificate.dynamicResidualBoundLInf) &&
  decide (certificate.qeiMarginBoundSI <= certificate.qeiMinMarginSI)

def CampaignCertificateBoundsPass (certificate : CampaignCertificate) : Prop :=
  CampaignCertificateBoundsPassBool certificate = true

def CampaignCertificateGatesPassBool (certificate : CampaignCertificate) : Bool :=
  certificate.profileMatchesExpected &&
  certificate.chartMatchesCampaign &&
  certificate.artifactHashesPresent &&
  certificate.atlasHashMatches &&
  certificate.hasT00 &&
  certificate.hasT0i &&
  certificate.hasDiagonalTij &&
  certificate.hasOffDiagonalTij &&
  certificate.fullTensorClosurePass &&
  certificate.independentlyDerivedTileMaterialTensor &&
  !certificate.copiedFromMetricRequiredTensor &&
  !certificate.fittedToMetricResidual &&
  !certificate.targetEchoDetected &&
  certificate.sourceIndependencePass &&
  certificate.switchingConservationPass &&
  certificate.covariantConservationPass &&
  certificate.frequencyConvergencePass &&
  certificate.frequencyFixedCycleAverageSource &&
  certificate.dynamicGeometryAgreementPass &&
  certificate.dynamicCycleAverageSourceFixed &&
  certificate.observerFamilyPass &&
  !certificate.eulerianOnly &&
  certificate.robustCheckComplete &&
  !certificate.anyObserverViolation &&
  certificate.hasNonEulerianFamilyPass &&
  certificate.wecReceipt &&
  certificate.necReceipt &&
  certificate.decReceipt &&
  certificate.secReceipt &&
  certificate.qeiReceiptsPass &&
  certificate.hasWallWorldline &&
  certificate.qeiDossierComplete &&
  certificate.qeiAllMarginsPass &&
  !certificate.qeiAnyProxy &&
  certificate.stabilityPass &&
  certificate.horizonPass &&
  certificate.blueshiftPass &&
  certificate.particleAccumulationPass &&
  certificate.perturbativeStabilityPass &&
  !certificate.routeEtaCertified

def CampaignCertificateGatesPass (certificate : CampaignCertificate) : Prop :=
  CampaignCertificateGatesPassBool certificate = true

def CampaignCertificateClaimLocksClosedBool (certificate : CampaignCertificate) : Bool :=
  !certificate.physicalViabilityClaimAllowed &&
  !certificate.transportClaimAllowed &&
  !certificate.routeEtaClaimAllowed &&
  !certificate.propulsionClaimAllowed &&
  !certificate.certifiedWarpSpeedClaimAllowed

def CampaignCertificateClaimLocksClosed (certificate : CampaignCertificate) : Prop :=
  CampaignCertificateClaimLocksClosedBool certificate = true

def DiagnosticCampaignAdmissible (certificate : CampaignCertificate) : Prop :=
  CampaignCertificateBoundsPass certificate /\
  CampaignCertificateGatesPass certificate /\
  CampaignCertificateClaimLocksClosed certificate

theorem diagnosticCampaignAdmissible_of_certificate
    (certificate : CampaignCertificate)
    (bounds : CampaignCertificateBoundsPass certificate)
    (gates : CampaignCertificateGatesPass certificate)
    (locks : CampaignCertificateClaimLocksClosed certificate) :
    DiagnosticCampaignAdmissible certificate := by
  exact And.intro bounds (And.intro gates locks)

theorem diagnosticCampaignAdmissible_preserves_claim_locks
    (certificate : CampaignCertificate)
    (admissible : DiagnosticCampaignAdmissible certificate) :
    CampaignCertificateClaimLocksClosed certificate := by
  exact admissible.2.2

def referenceGoodCertificate : CampaignCertificate := {
  selectedProfileId := "fixture"
  profileMatchesExpected := true
  chartMatchesCampaign := true
  artifactHashesPresent := true
  atlasHashMatches := true
  hasT00 := true
  hasT0i := true
  hasDiagonalTij := true
  hasOffDiagonalTij := true
  fullTensorClosurePass := true
  maxRegionalResidual := (1 : Rat) / (20 : Rat)
  regionalResidualTolerance := (1 : Rat) / (10 : Rat)
  independentlyDerivedTileMaterialTensor := true
  copiedFromMetricRequiredTensor := false
  fittedToMetricResidual := false
  targetEchoDetected := false
  sourceIndependencePass := true
  switchingConservationPass := true
  covariantConservationPass := true
  conservationResidualLInf := (1 : Rat) / (20 : Rat)
  conservationToleranceLInf := (1 : Rat) / (10 : Rat)
  frequencyConvergencePass := true
  frequencyFixedCycleAverageSource := true
  frequencyMaxResidualLInf := 0
  frequencyToleranceLInf := (1 : Rat) / (10 : Rat)
  dynamicGeometryAgreementPass := true
  dynamicCycleAverageSourceFixed := true
  dynamicResidualLInf := 0
  dynamicResidualBoundLInf := 0
  observerFamilyPass := true
  eulerianOnly := false
  robustCheckComplete := true
  anyObserverViolation := false
  hasNonEulerianFamilyPass := true
  wecReceipt := true
  necReceipt := true
  decReceipt := true
  secReceipt := true
  qeiReceiptsPass := true
  hasWallWorldline := true
  qeiDossierComplete := true
  qeiAllMarginsPass := true
  qeiAnyProxy := false
  qeiMinMarginSI := (1 : Rat) / (20 : Rat)
  qeiMarginBoundSI := 0
  stabilityPass := true
  horizonPass := true
  blueshiftPass := true
  particleAccumulationPass := true
  perturbativeStabilityPass := true
  alphaCenterline := (7 : Rat) / (10 : Rat)
  coordinateTimeSeconds := 137755965917 / 1000
  shipProperTimeSeconds := 964291761419 / 10000
  routeEtaCertified := false
  physicalViabilityClaimAllowed := false
  transportClaimAllowed := false
  routeEtaClaimAllowed := false
  propulsionClaimAllowed := false
  certifiedWarpSpeedClaimAllowed := false
}

def missingT0iFixture : CampaignCertificate :=
  { referenceGoodCertificate with hasT0i := false }

def staleHashFixture : CampaignCertificate :=
  { referenceGoodCertificate with atlasHashMatches := false }

def eulerianOnlyFixture : CampaignCertificate :=
  { referenceGoodCertificate with eulerianOnly := true, hasNonEulerianFamilyPass := false }

def scalarOnlyQeiFixture : CampaignCertificate :=
  { referenceGoodCertificate with hasWallWorldline := false, qeiDossierComplete := false }

def openClaimLocksFixture : CampaignCertificate :=
  { referenceGoodCertificate with physicalViabilityClaimAllowed := true }

example : Not (DiagnosticCampaignAdmissible missingT0iFixture) := by
  dsimp [
    DiagnosticCampaignAdmissible,
    CampaignCertificateBoundsPass,
    CampaignCertificateBoundsPassBool,
    CampaignCertificateGatesPass,
    CampaignCertificateGatesPassBool,
    CampaignCertificateClaimLocksClosed,
    CampaignCertificateClaimLocksClosedBool,
    missingT0iFixture,
    referenceGoodCertificate
  ]
  native_decide

example : Not (DiagnosticCampaignAdmissible staleHashFixture) := by
  dsimp [
    DiagnosticCampaignAdmissible,
    CampaignCertificateBoundsPass,
    CampaignCertificateBoundsPassBool,
    CampaignCertificateGatesPass,
    CampaignCertificateGatesPassBool,
    CampaignCertificateClaimLocksClosed,
    CampaignCertificateClaimLocksClosedBool,
    staleHashFixture,
    referenceGoodCertificate
  ]
  native_decide

example : Not (DiagnosticCampaignAdmissible eulerianOnlyFixture) := by
  dsimp [
    DiagnosticCampaignAdmissible,
    CampaignCertificateBoundsPass,
    CampaignCertificateBoundsPassBool,
    CampaignCertificateGatesPass,
    CampaignCertificateGatesPassBool,
    CampaignCertificateClaimLocksClosed,
    CampaignCertificateClaimLocksClosedBool,
    eulerianOnlyFixture,
    referenceGoodCertificate
  ]
  native_decide

example : Not (DiagnosticCampaignAdmissible scalarOnlyQeiFixture) := by
  dsimp [
    DiagnosticCampaignAdmissible,
    CampaignCertificateBoundsPass,
    CampaignCertificateBoundsPassBool,
    CampaignCertificateGatesPass,
    CampaignCertificateGatesPassBool,
    CampaignCertificateClaimLocksClosed,
    CampaignCertificateClaimLocksClosedBool,
    scalarOnlyQeiFixture,
    referenceGoodCertificate
  ]
  native_decide

example : Not (DiagnosticCampaignAdmissible openClaimLocksFixture) := by
  dsimp [
    DiagnosticCampaignAdmissible,
    CampaignCertificateBoundsPass,
    CampaignCertificateBoundsPassBool,
    CampaignCertificateGatesPass,
    CampaignCertificateGatesPassBool,
    CampaignCertificateClaimLocksClosed,
    CampaignCertificateClaimLocksClosedBool,
    openClaimLocksFixture,
    referenceGoodCertificate
  ]
  native_decide

end NHM2Formal
