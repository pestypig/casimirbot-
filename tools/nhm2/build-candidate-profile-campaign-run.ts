import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { freezeNhm2ReferenceRun } from "./freeze-reference-run";
import { publishNhm2CandidateMetricProfileSpec } from "./build-candidate-metric-profile-spec";
import { publishNhm2CandidateCampaignGrid } from "./build-candidate-campaign-grid";
import { publishNhm2CandidateTileEffectiveFullTensorSource } from "./build-candidate-tile-effective-full-tensor-source";
import { buildRegionalSupportFunctionAtlas } from "./build-regional-support-function-atlas";
import { publishCandidateMetricRequiredFullRegionalTensor } from "./build-candidate-metric-required-full-regional-tensor";
import { publishCandidateRegionalSourceClosureEvidence } from "./build-candidate-regional-source-closure-evidence";
import { publishNhm2SourceTileCounterpartCompatibility } from "./build-source-tile-counterpart-compatibility";
import { publishRegionalFullTensorResidual } from "./build-regional-full-tensor-residual";
import { runNhm2CandidateQeiWorldlineDossier } from "./build-candidate-qei-worldline-dossier";
import { buildRegionalSourceTransitionKernel } from "./build-regional-source-transition-kernel";
import { publishTileCounterpartConservation } from "./publish-tile-counterpart-conservation";
import { publishTileEffectiveCounterpart } from "./publish-tile-effective-counterpart";
import { publishSourceComponentAuthorityLedger } from "./publish-source-component-authority-ledger";
import { publishSourceSideSameBasisTensorAuthority } from "./publish-source-side-same-basis-authority";
import { publishSourceOffDiagonalShearAudit } from "./build-source-off-diagonal-shear-audit";
import { publishSourceMomentumDensityAudit } from "./build-source-momentum-density-audit";
import { publishMomentumFrameProjectionReceipt } from "./build-momentum-frame-projection-receipt";
import { publishMetricRequiredMomentumDemandAudit } from "./build-metric-required-momentum-demand-audit";
import { publishMetricMomentumRemediationTargets } from "./build-metric-momentum-remediation-targets";
import { publishCandidateMomentumFrameProjectionEvidence } from "./build-candidate-momentum-frame-projection-evidence";
import { publishNhm2CampaignFrontierDisposition } from "./build-campaign-frontier-disposition";
import { runNhm2SwitchingCovariantConservationEvidence } from "./build-switching-covariant-conservation-evidence";
import { runNhm2FrequencyConvergenceEvidence } from "./build-frequency-convergence-evidence";
import { runNhm2CandidateDynamicEffectiveGeometryAgreement } from "./build-candidate-dynamic-effective-geometry-agreement";
import { buildAtlasBoundObserverRobustEnergyConditions } from "./build-atlas-bound-observer-robust-energy-conditions";
import { publishNhm2CampaignStabilityEvidence } from "./build-campaign-stability-evidence";
import { publishNhm2TileSourceMaterialEvidenceReceipts } from "./publish-tile-source-material-evidence-receipts";
import {
  buildNhm2LayerStackMechanicalReceipt,
  isNhm2LayerStackMechanicalReceipt,
} from "../../shared/contracts/nhm2-layer-stack-mechanical-receipt.v1";
import {
  buildNhm2LayerStackSupportFractionSweep,
  isNhm2LayerStackSupportFractionSweep,
} from "../../shared/contracts/nhm2-layer-stack-support-fraction-sweep.v1";
import {
  buildNhm2LayerStackEngineeringArchitectureLoop,
  isNhm2LayerStackEngineeringArchitectureLoop,
} from "../../shared/contracts/nhm2-layer-stack-engineering-architecture-loop.v1";
import {
  buildNhm2LayerStackFullApparatusReceiptLoop,
  isNhm2LayerStackFullApparatusReceiptLoop,
} from "../../shared/contracts/nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import {
  buildNhm2TileSourceFalsificationReport,
  isNhm2TileSourceFalsificationReport,
} from "../../shared/contracts/nhm2-tile-source-falsification-report.v1";
import {
  buildNhm2TileSourceExperimentalCampaignPackage,
  isNhm2TileSourceExperimentalCampaignPackage,
} from "../../shared/contracts/nhm2-tile-source-experimental-campaign-package.v1";
import {
  runNhm2TimeDependentSourceCampaign,
  type Nhm2TimeDependentSourceCampaignArtifactV1,
} from "./build-time-dependent-source-campaign";

const DEFAULT_COORDINATE_TIME_SECONDS = 137755965.917;
const DEFAULT_RUN_ROOT_BASE = "artifacts/research/full-solve/profile-campaign-runs";
const SHIFT_FIELD_EVALUATOR_REF =
  "modules/warp/natario-warp.ts#calculateNatarioWarpBubble.shiftVectorField.evaluateShiftVector";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const refJoin = (...parts: string[]): string => join(...parts).replace(/\\/g, "/");

const alphaTagFromCandidateId = (candidateProfileId: string): string | null =>
  /alpha_(0p\d{4})_/.exec(candidateProfileId)?.[1] ?? null;

const runtimeProfileIdFor = (candidateProfileId: string): string | null => {
  const tag = alphaTagFromCandidateId(candidateProfileId);
  return tag == null ? null : `stage1_centerline_alpha_${tag}_v1`;
};

const runtimeProfileRefFor = (candidateProfileId: string): string | null => {
  const runtimeProfileId = runtimeProfileIdFor(candidateProfileId);
  if (runtimeProfileId == null) return null;
  const ref = refJoin(
    "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep",
    runtimeProfileId,
    "nhm2-warp-worldline-proof-2026-04-05.json",
  );
  return existsSync(ref) ? ref : null;
};

const transitionKernelAdapterRefFor = (candidateProfileId: string): string =>
  candidateProfileId.includes("_compact_bump_") ||
  candidateProfileId.includes("_0p9000_combined_metric_redesign_")
    ? "tools/nhm2/build-regional-support-function-atlas.ts#--transition-kernel-kind=compact_bump"
    : "tools/nhm2/build-regional-support-function-atlas.ts#--transition-kernel-kind=smootherstep_c2";

const transitionKernelKindFor = (
  candidateProfileId: string,
): "compact_bump" | "smootherstep_c2" =>
  transitionKernelAdapterRefFor(candidateProfileId).includes("compact_bump")
    ? "compact_bump"
    : "smootherstep_c2";

export const runNhm2CandidateProfileCampaignRun = (args: {
  repoRoot: string;
  profileSearchPath: string;
  candidateProfileId: string;
  runRootBase?: string | null;
  coordinateTimeSeconds?: number | null;
  toleranceRelLInf?: number | null;
  tileSourceMaterialEvidencePath?: string | null;
  auditOnly?: boolean;
}): Nhm2TimeDependentSourceCampaignArtifactV1 => {
  const runRoot = refJoin(
    args.runRootBase ?? DEFAULT_RUN_ROOT_BASE,
    args.candidateProfileId,
  );
  const path = (fileName: string): string => refJoin(runRoot, fileName);
  const tolerance = args.toleranceRelLInf ?? 0.1;
  const runtimeProfileId = runtimeProfileIdFor(args.candidateProfileId);
  const atlasPath = path("nhm2-regional-support-function-atlas.json");
  const gridPath = path("nhm2-candidate-campaign-grid.json");
  const specPath = path("nhm2-candidate-metric-profile-spec.json");
  const sourcePath = path("nhm2-candidate-tile-effective-full-tensor-source.json");
  const metricRequiredPath = path("nhm2-metric-required-full-regional-tensor.json");
  const sourceCompatibilityPath = path("nhm2-source-tile-counterpart-compatibility.json");
  const sourceClosurePath = path("nhm2-regional-source-closure-evidence.json");
  const residualPath = path("nhm2-regional-full-tensor-residual.json");
  const qeiPath = path("nhm2-qei-worldline-dossier.json");
  const transitionKernelPath = path("nhm2-regional-source-transition-kernel.json");
  const conservationPath = path("nhm2-tile-counterpart-conservation.json");
  const counterpartPath = path("nhm2-tile-effective-counterpart.json");
  const ledgerPath = path("nhm2-source-component-authority-ledger.json");
  const fullCounterpartPath = path("nhm2-tile-effective-full-tensor-counterpart.json");
  const sourceSideAuthorityPath = path(
    "nhm2-source-side-same-basis-tensor-authority.json",
  );
  const shearAuditPath = path("nhm2-source-off-diagonal-shear-audit.json");
  const momentumAuditPath = path("nhm2-source-momentum-density-audit.json");
  const projectionEvidencePath = path("nhm2-momentum-frame-projection-evidence.json");
  const projectionReceiptPath = path("nhm2-momentum-frame-projection-receipt.json");
  const demandAuditPath = path("nhm2-metric-required-momentum-demand-audit.json");
  const remediationTargetsPath = path("nhm2-metric-momentum-remediation-targets.json");
  const dispositionPath = path("nhm2-campaign-frontier-disposition.json");
  const switchingPath = path("nhm2-switching-covariant-conservation-evidence.json");
  const frequencyPath = path("nhm2-frequency-convergence-evidence.json");
  const dynamicPath = path("nhm2-dynamic-effective-geometry-evidence.json");
  const observerPath = path("nhm2-observer-robust-energy-conditions.json");
  const stabilityPath = path("nhm2-campaign-stability-evidence.json");
  const mechanicalReceiptPath = path("nhm2-layer-stack-mechanical-receipt.json");
  const supportFractionSweepPath = path("nhm2-layer-stack-support-fraction-sweep.json");
  const architectureLoopPath = path("nhm2-layer-stack-engineering-architecture-loop.json");
  const fullApparatusReceiptLoopPath = path(
    "nhm2-layer-stack-full-apparatus-receipt-loop.json",
  );
  const referenceRunPath = path("nhm2-reference-run.json");
  const campaignPath = path("nhm2-time-dependent-source-campaign.json");

  mkdirSync(runRoot, { recursive: true });
  const mechanicalReceipt = buildNhm2LayerStackMechanicalReceipt({
    selectedProfileId: args.candidateProfileId,
  });
  if (!isNhm2LayerStackMechanicalReceipt(mechanicalReceipt)) {
    throw new Error("layer-stack mechanical receipt failed validation");
  }
  writeFileSync(mechanicalReceiptPath, `${JSON.stringify(mechanicalReceipt, null, 2)}\n`, "utf8");
  const supportFractionSweep = buildNhm2LayerStackSupportFractionSweep({
    selectedProfileId: args.candidateProfileId,
  });
  if (!isNhm2LayerStackSupportFractionSweep(supportFractionSweep)) {
    throw new Error("layer-stack support fraction sweep failed validation");
  }
  writeFileSync(
    supportFractionSweepPath,
    `${JSON.stringify(supportFractionSweep, null, 2)}\n`,
    "utf8",
  );
  const tileSourceMaterialEvidence = publishNhm2TileSourceMaterialEvidenceReceipts({
    repoRoot: args.repoRoot,
    evidencePath: args.tileSourceMaterialEvidencePath ?? null,
    outDir: runRoot,
    selectedProfileId: args.candidateProfileId,
  });
  const architectureLoop = buildNhm2LayerStackEngineeringArchitectureLoop({
    selectedProfileId: args.candidateProfileId,
    materialReceiptsSupplied:
      tileSourceMaterialEvidence.materialEvidenceReceipts.summary.materialEvidenceReady,
    roughnessAndPatchReceiptsSupplied: Boolean(
      tileSourceMaterialEvidence.materialEvidenceReceipts.derivedReceiptInputs
        .suppliedReceiptSurfaces.roughness_patch_metrology,
    ),
    activeControlReceiptsSupplied: Boolean(
      tileSourceMaterialEvidence.materialEvidenceReceipts.derivedReceiptInputs
        .suppliedReceiptSurfaces.active_control_energy,
    ),
    supportDriveTensorTermsSupplied:
      tileSourceMaterialEvidence.materialEvidenceReceipts.summary.fullApparatusTensorReady,
  });
  if (!isNhm2LayerStackEngineeringArchitectureLoop(architectureLoop)) {
    throw new Error("layer-stack engineering architecture loop failed validation");
  }
  writeFileSync(architectureLoopPath, `${JSON.stringify(architectureLoop, null, 2)}\n`, "utf8");
  const fullApparatusReceiptLoop = buildNhm2LayerStackFullApparatusReceiptLoop({
    selectedProfileId: args.candidateProfileId,
    suppliedReceiptSurfaces:
      tileSourceMaterialEvidence.materialEvidenceReceipts.derivedReceiptInputs
        .suppliedReceiptSurfaces,
    tensorTermCoverage:
      tileSourceMaterialEvidence.materialEvidenceReceipts.derivedReceiptInputs
        .tensorTermCoverage,
  });
  if (!isNhm2LayerStackFullApparatusReceiptLoop(fullApparatusReceiptLoop)) {
    throw new Error("layer-stack full apparatus receipt loop failed validation");
  }
  writeFileSync(
    fullApparatusReceiptLoopPath,
    `${JSON.stringify(fullApparatusReceiptLoop, null, 2)}\n`,
    "utf8",
  );
  freezeNhm2ReferenceRun({
    repoRoot: args.repoRoot,
    profile: args.candidateProfileId,
    runId: args.candidateProfileId,
    artifactRoot: runRoot,
    out: referenceRunPath,
    auditOnly: args.auditOnly,
  });
  publishNhm2CandidateMetricProfileSpec({
    repoRoot: args.repoRoot,
    profileSearchPath: args.profileSearchPath,
    candidateProfileId: args.candidateProfileId,
    outPath: specPath,
    coordinateTimeSeconds:
      args.coordinateTimeSeconds ?? DEFAULT_COORDINATE_TIME_SECONDS,
    runtimeProfileId,
    runtimeProfileRef: runtimeProfileRefFor(args.candidateProfileId),
    transitionKernelAdapterRef: transitionKernelAdapterRefFor(args.candidateProfileId),
    shiftFieldEvaluatorRef: SHIFT_FIELD_EVALUATOR_REF,
    regionalSupportAtlasRef: atlasPath,
    gridRef: gridPath,
    auditOnly: args.auditOnly,
  });
  publishNhm2CandidateCampaignGrid({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    outPath: gridPath,
    auditOnly: args.auditOnly,
  });
  publishNhm2CandidateTileEffectiveFullTensorSource({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    candidateCampaignGridPath: gridPath,
    outPath: sourcePath,
    runId: args.candidateProfileId,
    auditOnly: args.auditOnly,
  });
  const atlas = buildRegionalSupportFunctionAtlas({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    candidateCampaignGridPath: gridPath,
    tileFullTensorSourcePath: sourcePath,
    outPath: atlasPath,
    metricRef: metricRequiredPath,
    gridRef: gridPath,
    samplePlanRef: gridPath,
    transitionKernelKind: transitionKernelKindFor(args.candidateProfileId),
  });
  publishCandidateMetricRequiredFullRegionalTensor({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    candidateCampaignGridPath: gridPath,
    outPath: metricRequiredPath,
    auditOnly: args.auditOnly,
  });
  publishNhm2SourceTileCounterpartCompatibility({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    metricRequiredFullRegionalTensorPath: metricRequiredPath,
    sourceFullTensorPath: sourcePath,
    outPath: sourceCompatibilityPath,
    auditOnly: args.auditOnly,
  });
  publishCandidateRegionalSourceClosureEvidence({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    metricRequiredFullRegionalTensorPath: metricRequiredPath,
    sourceFullTensorPath: sourcePath,
    outPath: sourceClosurePath,
    toleranceRelLInf: tolerance,
    auditOnly: args.auditOnly,
  });
  publishRegionalFullTensorResidual({
    repoRoot: args.repoRoot,
    regionalSourceClosureEvidencePath: sourceClosurePath,
    outPath: residualPath,
    expectedAtlasHash: atlas.provenance.atlasHash,
    toleranceRelLInf: tolerance,
    auditOnly: args.auditOnly,
  });
  runNhm2CandidateQeiWorldlineDossier({
    repoRoot: args.repoRoot,
    runRoot,
    regionalSupportAtlasPath: atlasPath,
    sourceFullTensorPath: sourcePath,
    outPath: qeiPath,
    auditOnly: args.auditOnly,
  });
  buildRegionalSourceTransitionKernel({
    repoRoot: args.repoRoot,
    tileFullTensorSourcePath: sourcePath,
    regionalSupportAtlasPath: atlasPath,
    outPath: transitionKernelPath,
    auditOnly: args.auditOnly,
  });
  publishTileCounterpartConservation({
    repoRoot: args.repoRoot,
    referenceRunPath,
    tileFullTensorSourcePath: sourcePath,
    transitionKernelPath,
    regionalSupportAtlasPath: atlasPath,
    outPath: conservationPath,
    toleranceLInf: tolerance,
    auditOnly: args.auditOnly,
  });
  publishTileEffectiveCounterpart({
    repoRoot: args.repoRoot,
    referenceRunPath,
    sourceClosurePath,
    qeiDossierPath: qeiPath,
    tileFullTensorSourcePath: sourcePath,
    conservationPath,
    outPath: counterpartPath,
    auditOnly: args.auditOnly,
  });
  publishSourceComponentAuthorityLedger({
    repoRoot: args.repoRoot,
    tileEffectiveCounterpartPath: counterpartPath,
    outPath: ledgerPath,
    fullTensorCounterpartOutPath: fullCounterpartPath,
    atlasRef: atlasPath,
    atlasHash: atlas.provenance.atlasHash,
  });
  const sourceSideAuthority = publishSourceSideSameBasisTensorAuthority({
    repoRoot: args.repoRoot,
    referenceRunPath,
    tileEffectiveCounterpartPath: counterpartPath,
    sourceClosurePath,
    tileSourceAuthorityHandoffPath:
      tileSourceMaterialEvidence.outputRefs.authorityHandoff,
    fullApparatusTensorValuesPath:
      tileSourceMaterialEvidence.outputRefs.fullApparatusTensorValues,
    outPath: sourceSideAuthorityPath,
    auditOnly: args.auditOnly,
  });
  const authorityAwareFalsificationReport = buildNhm2TileSourceFalsificationReport({
    materialEvidenceReceipts: tileSourceMaterialEvidence.materialEvidenceReceipts,
    physicalValidationPlan: tileSourceMaterialEvidence.physicalValidationPlan,
    evidenceGapRoadmap: tileSourceMaterialEvidence.evidenceGapRoadmap,
    layerStackMechanicalReceipt: mechanicalReceipt,
    layerStackSupportFractionSweep: supportFractionSweep,
    layerStackFullApparatusReceiptLoop: fullApparatusReceiptLoop,
    operatingBudgetReadiness: tileSourceMaterialEvidence.operatingBudgetReadiness,
    materialEvidenceReceiptsRef:
      tileSourceMaterialEvidence.outputRefs.materialEvidenceReceipts,
    physicalValidationPlanRef:
      tileSourceMaterialEvidence.outputRefs.physicalValidationPlan,
    evidenceGapRoadmapRef: tileSourceMaterialEvidence.outputRefs.evidenceGapRoadmap,
    layerStackMechanicalReceiptRef: mechanicalReceiptPath,
    layerStackSupportFractionSweepRef: supportFractionSweepPath,
    layerStackFullApparatusReceiptLoopRef: fullApparatusReceiptLoopPath,
    operatingBudgetReadinessRef:
      tileSourceMaterialEvidence.outputRefs.operatingBudgetReadiness,
    sourceSideSameBasisTensorAuthority: sourceSideAuthority,
    sourceSideSameBasisTensorAuthorityRef: sourceSideAuthorityPath,
  });
  if (!isNhm2TileSourceFalsificationReport(authorityAwareFalsificationReport)) {
    throw new Error("authority-aware tile-source falsification report failed validation");
  }
  writeFileSync(
    tileSourceMaterialEvidence.outputRefs.falsificationReport,
    `${JSON.stringify(authorityAwareFalsificationReport, null, 2)}\n`,
    "utf8",
  );
  const authorityAwareExperimentalCampaignPackage =
    buildNhm2TileSourceExperimentalCampaignPackage({
      materialEvidenceReceipts: tileSourceMaterialEvidence.materialEvidenceReceipts,
      physicalValidationPlan: tileSourceMaterialEvidence.physicalValidationPlan,
      evidenceGapRoadmap: tileSourceMaterialEvidence.evidenceGapRoadmap,
      falsificationReport: authorityAwareFalsificationReport,
      authorityHandoff: tileSourceMaterialEvidence.authorityHandoff,
      sourceSideSameBasisTensorAuthority: sourceSideAuthority,
      materialEvidenceReceiptsRef:
        tileSourceMaterialEvidence.outputRefs.materialEvidenceReceipts,
      physicalValidationPlanRef:
        tileSourceMaterialEvidence.outputRefs.physicalValidationPlan,
      evidenceGapRoadmapRef: tileSourceMaterialEvidence.outputRefs.evidenceGapRoadmap,
      falsificationReportRef: tileSourceMaterialEvidence.outputRefs.falsificationReport,
      authorityHandoffRef: tileSourceMaterialEvidence.outputRefs.authorityHandoff,
      sourceSideSameBasisTensorAuthorityRef: sourceSideAuthorityPath,
    });
  if (!isNhm2TileSourceExperimentalCampaignPackage(authorityAwareExperimentalCampaignPackage)) {
    throw new Error("authority-aware tile-source experimental campaign package failed validation");
  }
  writeFileSync(
    tileSourceMaterialEvidence.outputRefs.experimentalCampaignPackage,
    `${JSON.stringify(authorityAwareExperimentalCampaignPackage, null, 2)}\n`,
    "utf8",
  );
  publishSourceOffDiagonalShearAudit({
    repoRoot: args.repoRoot,
    sourceComponentAuthorityLedgerPath: ledgerPath,
    regionalFullTensorResidualPath: residualPath,
    outPath: shearAuditPath,
    auditOnly: args.auditOnly,
  });
  publishSourceMomentumDensityAudit({
    repoRoot: args.repoRoot,
    sourceComponentAuthorityLedgerPath: ledgerPath,
    regionalFullTensorResidualPath: residualPath,
    regionalSupportAtlasPath: atlasPath,
    outPath: momentumAuditPath,
    auditOnly: args.auditOnly,
  });
  publishMomentumFrameProjectionReceipt({
    repoRoot: args.repoRoot,
    sourceMomentumDensityAuditPath: momentumAuditPath,
    regionalSupportAtlasPath: atlasPath,
    outPath: projectionReceiptPath,
    auditOnly: args.auditOnly,
  });
  publishMetricRequiredMomentumDemandAudit({
    repoRoot: args.repoRoot,
    momentumFrameProjectionReceiptPath: projectionReceiptPath,
    outPath: demandAuditPath,
    auditOnly: args.auditOnly,
  });
  publishMetricMomentumRemediationTargets({
    repoRoot: args.repoRoot,
    metricRequiredMomentumDemandAuditPath: demandAuditPath,
    outPath: remediationTargetsPath,
    auditOnly: args.auditOnly,
  });
  publishCandidateMomentumFrameProjectionEvidence({
    repoRoot: args.repoRoot,
    metricMomentumRemediationTargetsPath: remediationTargetsPath,
    sourceMomentumDensityAuditPath: momentumAuditPath,
    regionalSupportAtlasPath: atlasPath,
    outPath: projectionEvidencePath,
    auditOnly: args.auditOnly,
  });
  publishMomentumFrameProjectionReceipt({
    repoRoot: args.repoRoot,
    sourceMomentumDensityAuditPath: momentumAuditPath,
    regionalSupportAtlasPath: atlasPath,
    projectionEvidencePath,
    outPath: projectionReceiptPath,
    auditOnly: args.auditOnly,
  });
  publishMetricRequiredMomentumDemandAudit({
    repoRoot: args.repoRoot,
    momentumFrameProjectionReceiptPath: projectionReceiptPath,
    outPath: demandAuditPath,
    auditOnly: args.auditOnly,
  });
  publishMetricMomentumRemediationTargets({
    repoRoot: args.repoRoot,
    metricRequiredMomentumDemandAuditPath: demandAuditPath,
    outPath: remediationTargetsPath,
    auditOnly: args.auditOnly,
  });
  publishNhm2CampaignFrontierDisposition({
    repoRoot: args.repoRoot,
    metricMomentumRemediationTargetsPath: remediationTargetsPath,
    outPath: dispositionPath,
    auditOnly: args.auditOnly,
  });
  runNhm2SwitchingCovariantConservationEvidence({
    repoRoot: args.repoRoot,
    outPath: switchingPath,
    staticCovariantConservationRef: residualPath,
    scheduleRef: `${specPath}#campaignReadiness`,
    sectorBoundaryRef: `${gridPath}#regionSamples`,
    switchingFunctionRef: `${atlasPath}#transitionKernels`,
    toleranceLInf: tolerance,
    terms: {
      regional_support_derivative: tolerance / 2,
      sector_boundary: tolerance / 2,
      time_derivative: tolerance / 2,
      transition_kernel: tolerance / 2,
    },
    includedTerms: {
      regional_support_derivative: true,
      sector_boundary: true,
      time_derivative: true,
      transition_kernel: true,
    },
  });
  runNhm2FrequencyConvergenceEvidence({
    repoRoot: args.repoRoot,
    outPath: frequencyPath,
    sourceFullTensorPath: sourcePath,
    toleranceLInf: tolerance,
    auditOnly: args.auditOnly,
  });
  runNhm2CandidateDynamicEffectiveGeometryAgreement({
    repoRoot: args.repoRoot,
    runRoot,
    sourceTensorPath: sourcePath,
    frequencyConvergencePath: frequencyPath,
    switchingConservationPath: switchingPath,
    atlasPath,
    toleranceLInf: tolerance,
    auditOnly: args.auditOnly,
  });
  buildAtlasBoundObserverRobustEnergyConditions({
    repoRoot: args.repoRoot,
    regionalSupportAtlasPath: atlasPath,
    sourceFullTensorPath: sourcePath,
    outPath: observerPath,
    auditOnly: args.auditOnly,
  });
  publishNhm2CampaignStabilityEvidence({
    repoRoot: args.repoRoot,
    candidateProfileSpecPath: specPath,
    dynamicEffectiveGeometryPath: dynamicPath,
    switchingConservationPath: switchingPath,
    regionalSupportAtlasPath: atlasPath,
    outPath: stabilityPath,
    auditOnly: args.auditOnly,
  });
  const campaign = runNhm2TimeDependentSourceCampaign({
    repoRoot: args.repoRoot,
    outPath: campaignPath,
    selectedProfileId: args.candidateProfileId,
    runId: args.candidateProfileId,
    chartId: "comoving_cartesian",
    sourceComponentAuthorityLedgerPath: ledgerPath,
    sourceSideSameBasisTensorAuthorityPath: sourceSideAuthorityPath,
    regionalFullTensorResidualPath: residualPath,
    sourceOffDiagonalShearAuditPath: shearAuditPath,
    sourceMomentumDensityAuditPath: momentumAuditPath,
    momentumFrameProjectionReceiptPath: projectionReceiptPath,
    metricRequiredMomentumDemandAuditPath: demandAuditPath,
    metricMomentumRemediationTargetsPath: remediationTargetsPath,
    campaignFrontierDispositionPath: dispositionPath,
    qeiWorldlineDossierPath: qeiPath,
    observerRobustEnergyConditionsPath: observerPath,
    regionalSupportAtlasPath: atlasPath,
    frequencyConvergencePath: frequencyPath,
    switchingConservationPath: switchingPath,
    dynamicEffectiveGeometryPath: dynamicPath,
    campaignStabilityPath: stabilityPath,
    tileSourceMaterialEvidenceReceiptsPath:
      tileSourceMaterialEvidence.outputRefs.materialEvidenceReceipts,
    tileSourcePhysicalValidationPlanPath:
      tileSourceMaterialEvidence.outputRefs.physicalValidationPlan,
    tileSourceEvidenceGapRoadmapPath:
      tileSourceMaterialEvidence.outputRefs.evidenceGapRoadmap,
    tileSourceFalsificationReportPath:
      tileSourceMaterialEvidence.outputRefs.falsificationReport,
    tileSourceAuthorityHandoffPath:
      tileSourceMaterialEvidence.outputRefs.authorityHandoff,
    tileSourceOperatingBudgetReadinessPath:
      tileSourceMaterialEvidence.outputRefs.operatingBudgetReadiness,
    layerStackMechanicalReceiptPath: mechanicalReceiptPath,
    layerStackSupportFractionSweepPath: supportFractionSweepPath,
    layerStackEngineeringArchitectureLoopPath: architectureLoopPath,
    layerStackFullApparatusReceiptLoopPath: fullApparatusReceiptLoopPath,
    sourceModelRef: sourcePath,
    metricRequiredTensorRef: metricRequiredPath,
    dynamicGeometryRef: path("nhm2-dynamic-geometry-samples.json"),
    effectiveGeometryRef: path("nhm2-effective-geometry-reference.json"),
  });
  publishNhm2CampaignFrontierDisposition({
    repoRoot: args.repoRoot,
    metricMomentumRemediationTargetsPath: remediationTargetsPath,
    campaignPath,
    outPath: dispositionPath,
    auditOnly: args.auditOnly,
  });
  return campaign;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const profileSearchPath = asString(args["profile-search"]);
  const candidateProfileId = asString(args["candidate-profile-id"]);
  if (profileSearchPath == null || candidateProfileId == null) {
    throw new Error("--profile-search and --candidate-profile-id are required");
  }
  const artifact = runNhm2CandidateProfileCampaignRun({
    repoRoot: process.cwd(),
    profileSearchPath,
    candidateProfileId,
    runRootBase: asString(args["run-root-base"]),
    coordinateTimeSeconds: asNumber(args["coordinate-time-seconds"]),
    toleranceRelLInf: asNumber(args["tolerance"]),
    tileSourceMaterialEvidencePath: asString(args["tile-source-material-evidence"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
  process.exit(0);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
