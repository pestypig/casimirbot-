import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  isNhm2CoupledClosurePassCandidateArtifact,
  type Nhm2CoupledClosurePassCandidateArtifactV1,
} from "../../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import {
  isNhm2CovariantConservationDiagnostic,
  type Nhm2CovariantConservationDiagnosticArtifactV1,
} from "../../shared/contracts/nhm2-covariant-conservation-diagnostic.v1";
import {
  isNhm2NatarioInvariantAudit,
  type Nhm2NatarioInvariantAuditV1,
} from "../../shared/contracts/nhm2-natario-invariant-audit.v1";
import {
  isNhm2ObserverRobustEnergyConditionArtifact,
  type Nhm2ObserverRobustEnergyConditionArtifactV1,
} from "../../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import {
  isNhm2QeiWorldlineDossier,
  type Nhm2QeiWorldlineDossierV1,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  isNhm2RegionalFullTensorResidual,
  type Nhm2RegionalFullTensorResidualArtifactV1,
} from "../../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  isNhm2RegionalTensorPassPathHarnessArtifact,
  type Nhm2RegionalTensorPassPathHarnessArtifactV1,
} from "../../shared/contracts/nhm2-regional-tensor-pass-path-harness.v1";
import {
  isNhm2SourceComponentAuthorityLedger,
  type Nhm2SourceComponentAuthorityLedgerArtifactV1,
} from "../../shared/contracts/nhm2-source-component-authority-ledger.v1";
import {
  buildNhm2TimeDependentSourceCampaign,
  isNhm2CampaignStabilityEvidence,
  isNhm2DynamicEffectiveGeometryEvidence,
  isNhm2FrequencyConvergenceEvidence,
  isNhm2SwitchingConservationEvidence,
  isNhm2TimeDependentSourceCampaignArtifact,
  type Nhm2CampaignStabilityEvidenceV1,
  type Nhm2DynamicEffectiveGeometryEvidenceV1,
  type Nhm2FrequencyConvergenceEvidenceV1,
  type Nhm2SwitchingConservationEvidenceV1,
  type Nhm2TimeDependentSourceCampaignArtifactV1,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";

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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8")) as unknown;

const readOptional = <T>(
  repoRoot: string,
  path: string | null,
  validator: (value: unknown) => value is T,
  label: string,
): T | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`${label} missing: ${path}`);
  }
  const value = readJson(repoRoot, path);
  if (!validator(value)) {
    throw new Error(`${label} has invalid contract`);
  }
  return value;
};

export const runNhm2TimeDependentSourceCampaign = (args: {
  repoRoot: string;
  outPath: string;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  sourceComponentAuthorityLedgerPath?: string | null;
  regionalFullTensorResidualPath?: string | null;
  covariantConservationDiagnosticPath?: string | null;
  qeiWorldlineDossierPath?: string | null;
  observerRobustEnergyConditionsPath?: string | null;
  natarioInvariantAuditPath?: string | null;
  regionalSupportAtlasPath?: string | null;
  casimirMaterialReceiptPath?: string | null;
  coupledClosurePassCandidatePath?: string | null;
  regionalTensorPassPathHarnessPath?: string | null;
  frequencyConvergencePath?: string | null;
  switchingConservationPath?: string | null;
  dynamicEffectiveGeometryPath?: string | null;
  campaignStabilityPath?: string | null;
  sourceModelRef?: string | null;
  metricRequiredTensorRef?: string | null;
  dynamicGeometryRef?: string | null;
  effectiveGeometryRef?: string | null;
}): Nhm2TimeDependentSourceCampaignArtifactV1 => {
  const sourceComponentAuthorityLedger =
    readOptional<Nhm2SourceComponentAuthorityLedgerArtifactV1>(
      args.repoRoot,
      args.sourceComponentAuthorityLedgerPath ?? null,
      isNhm2SourceComponentAuthorityLedger,
      "source component authority ledger",
    );
  const regionalFullTensorResidual =
    readOptional<Nhm2RegionalFullTensorResidualArtifactV1>(
      args.repoRoot,
      args.regionalFullTensorResidualPath ?? null,
      isNhm2RegionalFullTensorResidual,
      "regional full tensor residual",
    );
  const covariantConservationDiagnostic =
    readOptional<Nhm2CovariantConservationDiagnosticArtifactV1>(
      args.repoRoot,
      args.covariantConservationDiagnosticPath ?? null,
      isNhm2CovariantConservationDiagnostic,
      "covariant conservation diagnostic",
    );
  const qeiWorldlineDossier = readOptional<Nhm2QeiWorldlineDossierV1>(
    args.repoRoot,
    args.qeiWorldlineDossierPath ?? null,
    isNhm2QeiWorldlineDossier,
    "QEI worldline dossier",
  );
  const observerRobustEnergyConditions =
    readOptional<Nhm2ObserverRobustEnergyConditionArtifactV1>(
      args.repoRoot,
      args.observerRobustEnergyConditionsPath ?? null,
      isNhm2ObserverRobustEnergyConditionArtifact,
      "observer-robust energy conditions",
    );
  const natarioInvariantAudit = readOptional<Nhm2NatarioInvariantAuditV1>(
    args.repoRoot,
    args.natarioInvariantAuditPath ?? null,
    isNhm2NatarioInvariantAudit,
    "Natario invariant audit",
  );
  const regionalSupportFunctionAtlas =
    readOptional<Nhm2RegionalSupportFunctionAtlasV1>(
      args.repoRoot,
      args.regionalSupportAtlasPath ?? null,
      isNhm2RegionalSupportFunctionAtlas,
      "regional support-function atlas",
    );
  const casimirMaterialReceipt = readOptional<CasimirMaterialReceiptV1>(
    args.repoRoot,
    args.casimirMaterialReceiptPath ?? null,
    isCasimirMaterialReceipt,
    "Casimir material receipt",
  );
  const coupledClosurePassCandidate =
    readOptional<Nhm2CoupledClosurePassCandidateArtifactV1>(
      args.repoRoot,
      args.coupledClosurePassCandidatePath ?? null,
      isNhm2CoupledClosurePassCandidateArtifact,
      "coupled closure pass-candidate",
    );
  const regionalTensorPassPathHarness =
    readOptional<Nhm2RegionalTensorPassPathHarnessArtifactV1>(
      args.repoRoot,
      args.regionalTensorPassPathHarnessPath ?? null,
      isNhm2RegionalTensorPassPathHarnessArtifact,
      "regional tensor pass-path harness",
    );
  const frequencyConvergence = readOptional<Nhm2FrequencyConvergenceEvidenceV1>(
    args.repoRoot,
    args.frequencyConvergencePath ?? null,
    isNhm2FrequencyConvergenceEvidence,
    "frequency convergence evidence",
  );
  const switchingConservation = readOptional<Nhm2SwitchingConservationEvidenceV1>(
    args.repoRoot,
    args.switchingConservationPath ?? null,
    isNhm2SwitchingConservationEvidence,
    "switching conservation evidence",
  );
  const dynamicEffectiveGeometry =
    readOptional<Nhm2DynamicEffectiveGeometryEvidenceV1>(
      args.repoRoot,
      args.dynamicEffectiveGeometryPath ?? null,
      isNhm2DynamicEffectiveGeometryEvidence,
      "dynamic/effective geometry evidence",
    );
  const campaignStability = readOptional<Nhm2CampaignStabilityEvidenceV1>(
    args.repoRoot,
    args.campaignStabilityPath ?? null,
    isNhm2CampaignStabilityEvidence,
    "campaign stability evidence",
  );

  const artifact = buildNhm2TimeDependentSourceCampaign({
    laneId: args.laneId ?? null,
    selectedProfileId: args.selectedProfileId ?? null,
    runId: args.runId ?? null,
    chartId: args.chartId ?? null,
    artifactRefs: {
      sourceComponentAuthorityLedger: args.sourceComponentAuthorityLedgerPath ?? null,
      regionalFullTensorResidual: args.regionalFullTensorResidualPath ?? null,
      covariantConservationDiagnostic:
        args.covariantConservationDiagnosticPath ?? null,
      qeiWorldlineDossier: args.qeiWorldlineDossierPath ?? null,
      observerRobustEnergyConditions:
        args.observerRobustEnergyConditionsPath ?? null,
      natarioInvariantAudit: args.natarioInvariantAuditPath ?? null,
      regionalSupportFunctionAtlas: args.regionalSupportAtlasPath ?? null,
      casimirMaterialReceipt: args.casimirMaterialReceiptPath ?? null,
      coupledClosurePassCandidate: args.coupledClosurePassCandidatePath ?? null,
      regionalTensorPassPathHarness: args.regionalTensorPassPathHarnessPath ?? null,
      sourceModelRef: args.sourceModelRef ?? null,
      metricRequiredTensorRef: args.metricRequiredTensorRef ?? null,
      dynamicGeometryRef: args.dynamicGeometryRef ?? null,
      effectiveGeometryRef: args.effectiveGeometryRef ?? null,
      frequencyConvergence: args.frequencyConvergencePath ?? null,
      switchingConservation: args.switchingConservationPath ?? null,
      dynamicEffectiveGeometry: args.dynamicEffectiveGeometryPath ?? null,
      campaignStability: args.campaignStabilityPath ?? null,
    },
    sourceComponentAuthorityLedger,
    regionalFullTensorResidual,
    covariantConservationDiagnostic,
    qeiWorldlineDossier,
    observerRobustEnergyConditions,
    natarioInvariantAudit,
    regionalSupportFunctionAtlas,
    casimirMaterialReceipt,
    coupledClosurePassCandidate,
    regionalTensorPassPathHarness,
    frequencyConvergence,
    switchingConservation,
    dynamicEffectiveGeometry,
    campaignStability,
  });
  if (!isNhm2TimeDependentSourceCampaignArtifact(artifact)) {
    throw new Error(
      "built artifact failed nhm2_time_dependent_source_campaign/v1 validation",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  if (outPath == null) {
    throw new Error("missing required --out");
  }
  const artifact = runNhm2TimeDependentSourceCampaign({
    repoRoot: process.cwd(),
    outPath,
    laneId: asString(args["lane-id"]),
    selectedProfileId: asString(args["selected-profile-id"]),
    runId: asString(args["run-id"]),
    chartId: asString(args["chart-id"]),
    sourceComponentAuthorityLedgerPath: asString(
      args["source-component-authority-ledger"],
    ),
    regionalFullTensorResidualPath: asString(args["regional-full-tensor-residual"]),
    covariantConservationDiagnosticPath: asString(
      args["covariant-conservation-diagnostic"],
    ),
    qeiWorldlineDossierPath: asString(args["qei-worldline-dossier"]),
    observerRobustEnergyConditionsPath: asString(
      args["observer-robust-energy-conditions"],
    ),
    natarioInvariantAuditPath: asString(args["natario-invariant-audit"]),
    regionalSupportAtlasPath: asString(args["regional-support-atlas"]),
    casimirMaterialReceiptPath: asString(args["casimir-material-receipt"]),
    coupledClosurePassCandidatePath: asString(args["coupled-closure-pass-candidate"]),
    regionalTensorPassPathHarnessPath: asString(
      args["regional-tensor-pass-path-harness"],
    ),
    frequencyConvergencePath: asString(args["frequency-convergence"]),
    switchingConservationPath: asString(args["switching-conservation"]),
    dynamicEffectiveGeometryPath: asString(args["dynamic-effective-geometry"]),
    campaignStabilityPath: asString(args["campaign-stability"]),
    sourceModelRef: asString(args["source-model-ref"]),
    metricRequiredTensorRef: asString(args["metric-required-tensor-ref"]),
    dynamicGeometryRef: asString(args["dynamic-geometry-ref"]),
    effectiveGeometryRef: asString(args["effective-geometry-ref"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
