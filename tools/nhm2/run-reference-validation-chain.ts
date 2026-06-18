import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { normalize } from "node:path";
import { fileURLToPath } from "node:url";

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

const required = (args: Record<string, string | boolean>, key: string): string => {
  const value = args[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`missing required --${key}`);
  }
  return value;
};

const run = (
  script: string,
  args: string[],
  options: { allowNonZeroWithOutput?: string } = {},
): void => {
  const result = spawnSync("npm", ["run", script, "--", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (
    result.status !== 0 &&
    (options.allowNonZeroWithOutput == null ||
      !existsSync(options.allowNonZeroWithOutput))
  ) {
    throw new Error(`${script} failed with status ${result.status}`);
  }
};

export type Nhm2ReferenceValidationChainCommand = {
  script: string;
  args: string[];
  allowNonZeroWithOutput?: string;
};

const asOptionalString = (
  args: Record<string, string | boolean>,
  key: string,
): string | null => {
  const value = args[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const command = (
  script: string,
  args: string[],
  options: { allowNonZeroWithOutput?: string } = {},
): Nhm2ReferenceValidationChainCommand =>
  options.allowNonZeroWithOutput == null
    ? { script, args }
    : { script, args, allowNonZeroWithOutput: options.allowNonZeroWithOutput };

export const planReferenceValidationChain = (
  args: Record<string, string | boolean>,
): Nhm2ReferenceValidationChainCommand[] => {
  const referenceRun = required(args, "reference-run");
  const requestedSourceClosure = asOptionalString(args, "source-closure");
  const fullLoopAudit = required(args, "full-loop-audit");
  const qeiDossier = asOptionalString(args, "qei-dossier");
  const inputQeiWorldlineDossier = asOptionalString(args, "qei-worldline-dossier");
  const inputQeiBoundReceipt = asOptionalString(args, "qei-bound-receipt");
  const inputQeiWorldlineSamplePlan = asOptionalString(
    args,
    "qei-worldline-sample-plan",
  );
  const inputQeiPointwiseTransitionSourceSamples = asOptionalString(
    args,
    "qei-pointwise-transition-source-samples",
  );
  const inputQeiWorldlineSamplingReceipt = asOptionalString(
    args,
    "qei-worldline-sampling-receipt",
  );
  const inputObserverRobustEnergyConditions = asOptionalString(
    args,
    "observer-robust-energy-conditions",
  );
  const sourceInput = asOptionalString(args, "source-input");
  const regionalSamplePlan = asOptionalString(args, "regional-sample-plan");
  const inputConservation = asOptionalString(args, "conservation");
  const inputTransitionKernel = asOptionalString(args, "regional-source-transition-kernel");
  const buildRegionalSourceTransitionKernel =
    args["build-regional-source-transition-kernel"] === true;
  const inputRegionalSupportAtlas = asOptionalString(args, "regional-support-atlas");
  const buildRegionalSupportAtlas =
    args["build-regional-support-function-atlas"] === true;
  const supportDerivativeReceipt = asOptionalString(args, "support-derivative-receipt");
  const inputTileLocalSourceElements = asOptionalString(args, "tile-local-source-elements");
  const buildTileLocalSourceElements = args["build-tile-local-source-elements"] === true;
  const casimirMaterialReceipt = asOptionalString(args, "casimir-material-receipt");
  const regionalSourceClosureEvidence = asOptionalString(
    args,
    "regional-source-closure-evidence",
  );
  const inputLayeredWallSourceCandidate = asOptionalString(
    args,
    "layered-wall-source-candidate",
  );
  const wallMaterialSourceTensorModelInput = asOptionalString(
    args,
    "wall-material-source-tensor-model",
  );
  const wallSourceComponentModel = asOptionalString(args, "wall-source-component-model");
  const regionalMaterialSourceTensorModelInput = asOptionalString(
    args,
    "regional-material-source-tensor-model",
  );
  const regionalSourceComponentModel = asOptionalString(
    args,
    "regional-source-component-model",
  );
  const regionalSourceFullTensorTemplate = asOptionalString(
    args,
    "regional-source-full-tensor-template",
  );
  const metricRequiredFullTensorSource = asOptionalString(
    args,
    "metric-required-full-tensor-source",
  );
  const generateCurrentRuntimeSourceClosure =
    args["generate-current-runtime-source-closure"] === true;
  const currentRuntimeProfileId =
    asOptionalString(args, "current-runtime-profile-id") ??
    "stage1_centerline_alpha_0p995_v1";
  const generateMetricRequiredFullTensorSource =
    args["generate-metric-required-full-tensor-source"] === true;
  const metricRuntimeArtifactInput = asOptionalString(args, "metric-runtime-artifact");
  const layeredWallSourceCandidateRowId = asOptionalString(
    args,
    "layered-wall-source-candidate-row-id",
  );
  const layeredWallVolumeMode = asOptionalString(args, "layered-wall-volume-mode");
  const literatureMap =
    asOptionalString(args, "literature-map") ??
    "docs/research/nhm2-literature-claim-map.v1.json";
  const outRoot = required(args, "out-root");
  const runId = required(args, "run-id");
  const auditOnly = args["audit-only"] === true ? ["--audit-only"] : [];
  const commands: Nhm2ReferenceValidationChainCommand[] = [];
  const generatedCurrentRuntimeArtifact = `${outRoot}/nhm2-runtime-current.json`;
  const generatedCurrentSourceClosure = `${outRoot}/nhm2-source-closure-current.json`;
  const generatedCurrentRegionalFullTensorCoverage =
    `${outRoot}/nhm2-regional-full-tensor-coverage.json`;
  const sourceClosure = requestedSourceClosure ?? generatedCurrentSourceClosure;
  const metricRuntimeArtifact =
    metricRuntimeArtifactInput ??
    (generateCurrentRuntimeSourceClosure ? generatedCurrentRuntimeArtifact : null);
  const tileCounterpart = `${outRoot}/nhm2-tile-effective-counterpart.json`;
  const generatedTileLocalSourceElements = `${outRoot}/nhm2-tile-local-source-elements.json`;
  const tileLocalSourceElements =
    inputTileLocalSourceElements ??
    (buildTileLocalSourceElements ? generatedTileLocalSourceElements : null);
  const sourceTensor = `${outRoot}/nhm2-tile-effective-full-tensor-source.json`;
  const generatedConservation = `${outRoot}/nhm2-tile-counterpart-conservation.json`;
  const generatedTransitionKernel = `${outRoot}/nhm2-regional-source-transition-kernel.json`;
  const generatedRegionalSupportAtlas =
    `${outRoot}/nhm2-regional-support-function-atlas.json`;
  const regionalSupportAtlas =
    inputRegionalSupportAtlas ??
    (buildRegionalSupportAtlas ? generatedRegionalSupportAtlas : null);
  const conservation = inputConservation ?? (sourceInput == null ? null : generatedConservation);
  const transitionKernel =
    inputTransitionKernel ??
    (buildRegionalSourceTransitionKernel ? generatedTransitionKernel : null);
  const sourceIndependenceAudit = `${outRoot}/nhm2-tile-counterpart-source-independence.md`;
  const sourceAuthority = `${outRoot}/nhm2-source-side-same-basis-tensor-authority.json`;
  const sourceComponentAuthorityLedger =
    `${outRoot}/nhm2-source-component-authority-ledger.json`;
  const tileEffectiveFullTensorCounterpart =
    `${outRoot}/nhm2-tile-effective-full-tensor-counterpart.json`;
  const generatedMetricRequiredFullTensorSource =
    `${outRoot}/nhm2-metric-required-regional-full-tensor-source.json`;
  const effectiveMetricRequiredFullTensorSource =
    metricRequiredFullTensorSource ??
    (generateMetricRequiredFullTensorSource ? generatedMetricRequiredFullTensorSource : null);
  const metricRequiredRegionalTensorReceipt =
    `${outRoot}/nhm2-metric-required-regional-tensor-receipt.json`;
  const regionalEvidence = `${outRoot}/nhm2-regional-source-closure-evidence.json`;
  const regionalFullTensorResidual =
    `${outRoot}/nhm2-regional-full-tensor-residual.json`;
  const covariantConservationDiagnostic =
    regionalSupportAtlas == null || conservation == null
      ? null
      : `${outRoot}/nhm2-covariant-conservation-diagnostic.json`;
  const generatedQeiWorldlineDossier =
    regionalSupportAtlas == null || sourceInput == null
      ? null
      : `${outRoot}/nhm2-qei-worldline-dossier.json`;
  const generatedQeiBoundReceipt =
    generatedQeiWorldlineDossier == null
      ? null
      : `${outRoot}/nhm2-qei-bound-receipt.json`;
  const generatedQeiWorldlineSamplingReceipt =
    generatedQeiWorldlineDossier == null
      ? null
      : `${outRoot}/nhm2-qei-worldline-sampling-receipt.json`;
  const generatedQeiWorldlineSamplePlan =
    generatedQeiWorldlineDossier == null || transitionKernel == null
      ? null
      : `${outRoot}/nhm2-qei-worldline-sample-plan.json`;
  const generatedQeiPointwiseTransitionSourceSamples =
    generatedQeiWorldlineSamplePlan == null
      ? null
      : `${outRoot}/nhm2-qei-pointwise-transition-source-samples.json`;
  const qeiBoundReceipt = inputQeiBoundReceipt ?? generatedQeiBoundReceipt;
  const qeiWorldlineSamplePlan =
    inputQeiWorldlineSamplePlan ?? generatedQeiWorldlineSamplePlan;
  const qeiPointwiseTransitionSourceSamples =
    inputQeiPointwiseTransitionSourceSamples ??
    generatedQeiPointwiseTransitionSourceSamples;
  const qeiExplicitWorldlineSamples =
    asOptionalString(args, "qei-explicit-worldline-samples") ??
    qeiPointwiseTransitionSourceSamples;
  const qeiWorldlineSamplingReceipt =
    inputQeiWorldlineSamplingReceipt ?? generatedQeiWorldlineSamplingReceipt;
  const qeiWorldlineDossier =
    inputQeiWorldlineDossier ?? generatedQeiWorldlineDossier;
  const generatedObserverRobustEnergyConditions =
    regionalSupportAtlas == null || sourceInput == null
      ? null
      : `${outRoot}/nhm2-observer-robust-energy-conditions.json`;
  const observerRobustEnergyConditions =
    inputObserverRobustEnergyConditions ?? generatedObserverRobustEnergyConditions;
  const regionalSourceTensorTargets =
    `${outRoot}/nhm2-regional-source-tensor-targets.json`;
  const regionalSourceTensorCandidate =
    `${outRoot}/nhm2-regional-source-tensor-candidate.json`;
  const regionalSourceTensorQualityControl =
    `${outRoot}/nhm2-regional-source-tensor-quality-control.json`;
  const sourceClosurePassReadiness = `${outRoot}/nhm2-source-closure-pass-readiness.json`;
  const sourceClosurePassReadinessReport = `${outRoot}/nhm2-source-closure-pass-readiness.md`;
  const coupledClosurePassCandidate =
    `${outRoot}/nhm2-coupled-closure-pass-candidate.json`;
  const regionalTensorPassPathHarness =
    `${outRoot}/nhm2-regional-tensor-pass-path-harness.json`;
  const divergenceReport = `${outRoot}/nhm2-source-to-geometry-divergence.md`;
  const provenanceAudit = `${outRoot}/nhm2-tile-counterpart-provenance.md`;
  const validation = `${outRoot}/nhm2-reference-run-validation.json`;
  const ledger = `${outRoot}/nhm2-blocker-ledger-${runId}.json`;
  const ledgerReport = `${outRoot}/nhm2-blocker-ledger-${runId}.md`;
  const claimAdmission = `${outRoot}/nhm2-full-solve-claim-admission.json`;
  const wallSourceLayeringSweep = `${outRoot}/nhm2-wall-source-layering-sweep.json`;
  const generatedLayeredWallSourceCandidate =
    `${outRoot}/nhm2-layered-wall-source-candidate.json`;
  const layeredWallSourceCandidate =
    inputLayeredWallSourceCandidate ??
    (wallSourceComponentModel == null ? null : generatedLayeredWallSourceCandidate);
  const generatedWallMaterialSourceTensorModel =
    `${outRoot}/nhm2-wall-material-source-tensor-model.json`;
  const wallMaterialSourceTensorModel =
    wallMaterialSourceTensorModelInput ??
    (wallSourceComponentModel == null ? null : generatedWallMaterialSourceTensorModel);
  const generatedRegionalMaterialSourceTensorModel =
    `${outRoot}/nhm2-regional-material-source-tensor-model.json`;
  const regionalMaterialSourceTensorModel =
    regionalMaterialSourceTensorModelInput ??
    (regionalSourceComponentModel == null ? null : generatedRegionalMaterialSourceTensorModel);
  const layeredWallFullTensorAudit =
    `${outRoot}/nhm2-layered-wall-full-tensor-source-audit.json`;
  const layeredWallSourceTensorCandidate =
    `${outRoot}/nhm2-layered-wall-source-tensor-candidate.json`;

  if (regionalMaterialSourceTensorModelInput != null && regionalSourceComponentModel != null) {
    throw new Error(
      "--regional-material-source-tensor-model and --regional-source-component-model are mutually exclusive",
    );
  }
  if (metricRequiredFullTensorSource != null && generateMetricRequiredFullTensorSource) {
    throw new Error(
      "--metric-required-full-tensor-source and --generate-metric-required-full-tensor-source are mutually exclusive",
    );
  }
  if (generateCurrentRuntimeSourceClosure && requestedSourceClosure != null) {
    throw new Error(
      "--source-closure and --generate-current-runtime-source-closure are mutually exclusive",
    );
  }
  if (generateCurrentRuntimeSourceClosure && metricRuntimeArtifactInput != null) {
    throw new Error(
      "--metric-runtime-artifact and --generate-current-runtime-source-closure are mutually exclusive",
    );
  }
  if (!generateCurrentRuntimeSourceClosure && requestedSourceClosure == null) {
    throw new Error("missing required --source-closure");
  }
  if (generateMetricRequiredFullTensorSource && metricRuntimeArtifact == null) {
    throw new Error(
      "--generate-metric-required-full-tensor-source requires --metric-runtime-artifact or --generate-current-runtime-source-closure",
    );
  }
  if (inputConservation != null && sourceInput != null) {
    throw new Error(
      "--conservation and --source-input are mutually exclusive; source-input generates conservation inside the frozen chain",
    );
  }
  if (inputTransitionKernel != null && buildRegionalSourceTransitionKernel) {
    throw new Error(
      "--regional-source-transition-kernel and --build-regional-source-transition-kernel are mutually exclusive",
    );
  }
  if (inputRegionalSupportAtlas != null && buildRegionalSupportAtlas) {
    throw new Error(
      "--regional-support-atlas and --build-regional-support-function-atlas are mutually exclusive",
    );
  }
  if (supportDerivativeReceipt != null && !buildRegionalSupportAtlas) {
    throw new Error(
      "--support-derivative-receipt requires --build-regional-support-function-atlas so derivative support is hashed into the atlas",
    );
  }
  if ((inputTransitionKernel != null || buildRegionalSourceTransitionKernel) && sourceInput == null) {
    throw new Error(
      "regional source transition kernels require --source-input so the frozen chain can regenerate tile full-tensor source and conservation artifacts",
    );
  }
  if (regionalMaterialSourceTensorModel != null && wallMaterialSourceTensorModel != null) {
    throw new Error(
      "regional and wall material source tensor models are mutually exclusive; use the regional model to cover wall/hull/exterior together",
    );
  }
  if (wallMaterialSourceTensorModelInput != null && wallSourceComponentModel != null) {
    throw new Error(
      "--wall-material-source-tensor-model and --wall-source-component-model are mutually exclusive",
    );
  }
  if (wallMaterialSourceTensorModel != null && inputTileLocalSourceElements != null) {
    throw new Error(
      "--wall-material-source-tensor-model cannot be combined with prebuilt --tile-local-source-elements; rebuild tile-local elements so wall tensor provenance is explicit",
    );
  }
  if (regionalMaterialSourceTensorModel != null && inputTileLocalSourceElements != null) {
    throw new Error(
      "--regional-material-source-tensor-model cannot be combined with prebuilt --tile-local-source-elements; rebuild tile-local elements so regional tensor provenance is explicit",
    );
  }
  if (wallMaterialSourceTensorModel != null && !buildTileLocalSourceElements) {
    throw new Error(
      "--wall-material-source-tensor-model or --wall-source-component-model requires --build-tile-local-source-elements so the source tensor model is consumed",
    );
  }
  if (regionalMaterialSourceTensorModel != null && !buildTileLocalSourceElements) {
    throw new Error(
      "--regional-material-source-tensor-model or --regional-source-component-model requires --build-tile-local-source-elements so the source tensor model is consumed",
    );
  }

  if (generateCurrentRuntimeSourceClosure) {
    commands.push(command("nhm2:publish-current-runtime-source-closure", [
      "--out-root",
      outRoot,
      "--runtime-out",
      generatedCurrentRuntimeArtifact,
      "--source-closure-out",
      generatedCurrentSourceClosure,
      "--coverage-out",
      generatedCurrentRegionalFullTensorCoverage,
      "--selected-profile-id",
      currentRuntimeProfileId,
      "--run-id",
      runId,
    ]));
  }

  if (sourceInput != null) {
    commands.push(command("nhm2:publish-tile-effective-full-tensor-source", [
      "--reference-run",
      referenceRun,
      "--source-input",
      sourceInput,
      ...(regionalSamplePlan == null ? [] : ["--regional-sample-plan", regionalSamplePlan]),
      ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
      "--out",
      sourceTensor,
      ...auditOnly,
    ]));
    if (buildRegionalSupportAtlas) {
      commands.push(command("nhm2:build-regional-support-function-atlas", [
        "--reference-run",
        referenceRun,
        "--tile-full-tensor-source",
        sourceTensor,
        ...(supportDerivativeReceipt == null
          ? []
          : ["--support-derivative-receipt", supportDerivativeReceipt]),
        "--out",
        generatedRegionalSupportAtlas,
      ]));
    }
    if (buildRegionalSourceTransitionKernel) {
      commands.push(command("nhm2:build-regional-source-transition-kernel", [
        "--tile-full-tensor-source",
        sourceTensor,
        ...(regionalSupportAtlas == null
          ? []
          : ["--regional-support-atlas", regionalSupportAtlas]),
        "--out",
        generatedTransitionKernel,
        ...auditOnly,
      ]));
    }
    commands.push(command("nhm2:publish-tile-counterpart-conservation", [
      "--reference-run",
      referenceRun,
      "--tile-full-tensor-source",
      sourceTensor,
      ...(transitionKernel == null ? [] : ["--transition-kernel", transitionKernel]),
      ...(regionalSupportAtlas == null
        ? []
        : ["--regional-support-atlas", regionalSupportAtlas]),
      "--out",
      generatedConservation,
      ...auditOnly,
    ]));
    commands.push(command("nhm2:audit-tile-counterpart-source-independence", [
      "--tile-full-tensor-source",
      sourceTensor,
      "--out",
      sourceIndependenceAudit,
    ]));
  }

  if (sourceInput == null && buildRegionalSupportAtlas) {
    commands.push(command("nhm2:build-regional-support-function-atlas", [
      "--reference-run",
      referenceRun,
      ...(supportDerivativeReceipt == null
        ? []
        : ["--support-derivative-receipt", supportDerivativeReceipt]),
      "--out",
      generatedRegionalSupportAtlas,
    ]));
  }

  if (regionalSourceComponentModel != null) {
    commands.push(command("nhm2:build-regional-material-source-tensor-model", [
      "--component-model",
      regionalSourceComponentModel,
      ...(casimirMaterialReceipt == null
        ? []
        : ["--material-receipt", casimirMaterialReceipt]),
      "--out",
      generatedRegionalMaterialSourceTensorModel,
    ]));
  }

  if (wallSourceComponentModel != null) {
    if (inputLayeredWallSourceCandidate == null) {
      commands.push(command("nhm2:build-wall-source-layering-sweep", [
        ...(regionalSourceClosureEvidence == null
          ? []
          : ["--regional-source-closure-evidence", regionalSourceClosureEvidence]),
        "--out",
        wallSourceLayeringSweep,
      ]));
      commands.push(command("nhm2:build-layered-wall-source-candidate", [
        "--sweep",
        wallSourceLayeringSweep,
        ...(layeredWallSourceCandidateRowId == null
          ? []
          : ["--row-id", layeredWallSourceCandidateRowId]),
        ...(layeredWallVolumeMode == null
          ? []
          : ["--volume-mode", layeredWallVolumeMode]),
        ...(casimirMaterialReceipt == null
          ? []
          : ["--material-receipt", casimirMaterialReceipt]),
        ...(conservation == null ? [] : ["--conservation", conservation]),
        ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
        "--out",
        generatedLayeredWallSourceCandidate,
      ]));
    }
    commands.push(command("nhm2:build-wall-material-source-tensor-model", [
      "--candidate",
      layeredWallSourceCandidate as string,
      "--component-model",
      wallSourceComponentModel,
      ...(casimirMaterialReceipt == null
        ? []
        : ["--material-receipt", casimirMaterialReceipt]),
      "--out",
      generatedWallMaterialSourceTensorModel,
    ]));
  }

  if (layeredWallSourceCandidate != null && wallMaterialSourceTensorModel != null) {
    commands.push(command("nhm2:build-layered-wall-full-tensor-source-audit", [
      "--candidate",
      layeredWallSourceCandidate,
      "--source-tensor-model",
      wallMaterialSourceTensorModel,
      ...(casimirMaterialReceipt == null
        ? []
        : ["--material-receipt", casimirMaterialReceipt]),
      "--out",
      layeredWallFullTensorAudit,
    ]));
    commands.push(command("nhm2:build-layered-wall-source-tensor-candidate", [
      "--candidate",
      layeredWallSourceCandidate,
      "--full-tensor-audit",
      layeredWallFullTensorAudit,
      "--out",
      layeredWallSourceTensorCandidate,
    ]));
  }

  if (buildTileLocalSourceElements) {
    commands.push(command("nhm2:build-tile-local-source-elements", [
      "--reference-run",
      referenceRun,
      ...(casimirMaterialReceipt == null
        ? []
        : ["--casimir-material-receipt", casimirMaterialReceipt]),
      ...(wallMaterialSourceTensorModel == null
        ? []
        : ["--wall-material-source-tensor-model", wallMaterialSourceTensorModel]),
      ...(regionalMaterialSourceTensorModel == null
        ? []
        : ["--regional-material-source-tensor-model", regionalMaterialSourceTensorModel]),
      "--out",
      generatedTileLocalSourceElements,
      ...auditOnly,
    ]));
  }

  if (tileLocalSourceElements != null) {
    commands.push(command("nhm2:aggregate-tile-local-source-counterpart", [
      "--reference-run",
      referenceRun,
      "--tile-local-source-elements",
      tileLocalSourceElements,
      "--out",
      tileCounterpart,
      ...auditOnly,
    ]));
  } else {
    commands.push(command("nhm2:publish-tile-effective-counterpart", [
      "--reference-run",
      referenceRun,
      "--source-closure",
      sourceClosure,
      ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
      ...(sourceInput == null ? [] : ["--tile-full-tensor-source", sourceTensor, "--conservation", generatedConservation]),
      "--out",
      tileCounterpart,
      ...auditOnly,
    ]));
  }
  commands.push(command("nhm2:publish-source-side-same-basis-authority", [
    "--reference-run",
    referenceRun,
    "--tile-effective-counterpart",
    tileCounterpart,
    "--source-closure",
    sourceClosure,
    "--out",
    sourceAuthority,
    ...auditOnly,
  ]));
  commands.push(command("nhm2:publish-source-component-authority-ledger", [
    "--tile-effective-counterpart",
    tileCounterpart,
    ...(regionalSupportAtlas == null ? [] : ["--atlas-ref", regionalSupportAtlas]),
    "--out",
    sourceComponentAuthorityLedger,
    "--full-tensor-counterpart-out",
    tileEffectiveFullTensorCounterpart,
  ]));
  if (generateMetricRequiredFullTensorSource) {
    commands.push(command("nhm2:publish-metric-required-full-tensor-source", [
      "--reference-run",
      referenceRun,
      "--runtime-artifact",
      metricRuntimeArtifact as string,
      "--source-closure",
      sourceClosure,
      "--out",
      generatedMetricRequiredFullTensorSource,
      ...auditOnly,
    ]));
  }
  commands.push(command("nhm2:publish-metric-required-regional-tensor-receipt", [
    "--reference-run",
    referenceRun,
    "--source-closure",
    sourceClosure,
    ...(effectiveMetricRequiredFullTensorSource == null
      ? []
      : ["--metric-required-full-tensor-source", effectiveMetricRequiredFullTensorSource]),
    "--out",
    metricRequiredRegionalTensorReceipt,
    ...auditOnly,
  ]));
  commands.push(command("nhm2:publish-regional-source-closure-evidence", [
    "--reference-run",
    referenceRun,
    "--source-closure",
    sourceClosure,
    "--tile-effective-counterpart",
    tileCounterpart,
    "--metric-required-regional-tensor-receipt",
    metricRequiredRegionalTensorReceipt,
    ...(regionalSupportAtlas == null
      ? []
      : ["--regional-support-atlas", regionalSupportAtlas]),
    "--out",
    regionalEvidence,
    ...auditOnly,
  ]));
  commands.push(command("nhm2:build-regional-full-tensor-residual", [
    "--regional-source-closure-evidence",
    regionalEvidence,
    "--out",
    regionalFullTensorResidual,
    ...auditOnly,
  ]));
  if (covariantConservationDiagnostic != null) {
    commands.push(command("nhm2:build-covariant-conservation-diagnostic", [
      "--regional-support-atlas",
      regionalSupportAtlas as string,
      "--reduced-order-conservation",
      conservation as string,
      ...(sourceInput == null ? [] : ["--tensor-ref", sourceTensor]),
      "--out",
      covariantConservationDiagnostic,
      ...auditOnly,
    ]));
  }
  if (
    generatedQeiBoundReceipt != null &&
    inputQeiBoundReceipt == null &&
    inputQeiWorldlineDossier == null
  ) {
    commands.push(command("nhm2:build-qei-bound-receipt", [
      "--regional-support-atlas",
      regionalSupportAtlas as string,
      "--source-full-tensor",
      sourceTensor,
      "--out",
      generatedQeiBoundReceipt,
      ...(
        asOptionalString(args, "qei-bound-model-kind") == null
          ? []
          : ["--bound-model-kind", asOptionalString(args, "qei-bound-model-kind") as string]
      ),
      ...(
        asOptionalString(args, "qei-bound-si") == null
          ? []
          : ["--bound-si", asOptionalString(args, "qei-bound-si") as string]
      ),
      ...(
        asOptionalString(args, "qei-bound-provenance-ref") == null
          ? []
          : [
              "--bound-provenance-ref",
              asOptionalString(args, "qei-bound-provenance-ref") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-tau-seconds") == null
          ? []
          : ["--tau-seconds", asOptionalString(args, "qei-tau-seconds") as string]
      ),
      ...(
        asOptionalString(args, "qei-tau-source-ref") == null
          ? []
          : ["--tau-source-ref", asOptionalString(args, "qei-tau-source-ref") as string]
      ),
      ...(
        asOptionalString(args, "qei-duty-cycle") == null
          ? []
          : ["--duty-cycle", asOptionalString(args, "qei-duty-cycle") as string]
      ),
      ...(
        asOptionalString(args, "qei-duty-cycle-source-ref") == null
          ? []
          : [
              "--duty-cycle-source-ref",
              asOptionalString(args, "qei-duty-cycle-source-ref") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-light-crossing-seconds") == null
          ? []
          : [
              "--light-crossing-seconds",
              asOptionalString(args, "qei-light-crossing-seconds") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-light-crossing-source-ref") == null
          ? []
          : [
              "--light-crossing-source-ref",
              asOptionalString(args, "qei-light-crossing-source-ref") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-modulation-seconds") == null
          ? []
          : [
              "--modulation-seconds",
              asOptionalString(args, "qei-modulation-seconds") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-modulation-source-ref") == null
          ? []
          : [
              "--modulation-source-ref",
              asOptionalString(args, "qei-modulation-source-ref") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-sampling-kind") == null
          ? []
          : ["--sampling-kind", asOptionalString(args, "qei-sampling-kind") as string]
      ),
      ...(args["qei-sampling-normalized"] === undefined
        ? []
        : ["--sampling-normalized", String(args["qei-sampling-normalized"])]),
      ...(
        asOptionalString(args, "qei-qft-state-ref") == null
          ? []
          : ["--qft-state-ref", asOptionalString(args, "qei-qft-state-ref") as string]
      ),
      ...(
        asOptionalString(args, "qei-renormalization-ref") == null
          ? []
          : [
              "--renormalization-ref",
              asOptionalString(args, "qei-renormalization-ref") as string,
            ]
      ),
      ...(
        asOptionalString(args, "qei-renormalization-convention-ref") == null
          ? []
          : [
              "--renormalization-convention-ref",
              asOptionalString(args, "qei-renormalization-convention-ref") as string,
            ]
      ),
      ...(args["qei-stationary-worldline-assumption"] === undefined
        ? []
        : [
            "--stationary-worldline-assumption",
            String(args["qei-stationary-worldline-assumption"]),
          ]),
      ...auditOnly,
    ]));
  }
  if (
    generatedQeiWorldlineSamplePlan != null &&
    inputQeiWorldlineSamplePlan == null &&
    inputQeiWorldlineSamplingReceipt == null &&
    inputQeiWorldlineDossier == null
  ) {
    commands.push(command("nhm2:build-qei-worldline-sample-plan", [
      "--regional-support-atlas",
      regionalSupportAtlas as string,
      "--source-full-tensor",
      sourceTensor,
      "--transition-kernel",
      transitionKernel as string,
      "--out",
      generatedQeiWorldlineSamplePlan,
      ...auditOnly,
    ]));
  }
  if (
    generatedQeiPointwiseTransitionSourceSamples != null &&
    inputQeiPointwiseTransitionSourceSamples == null &&
    asOptionalString(args, "qei-explicit-worldline-samples") == null &&
    inputQeiWorldlineSamplingReceipt == null &&
    inputQeiWorldlineDossier == null
  ) {
    commands.push(command("nhm2:build-qei-pointwise-transition-source-samples", [
      "--qei-worldline-sample-plan",
      qeiWorldlineSamplePlan as string,
      "--source-full-tensor",
      sourceTensor,
      "--transition-kernel",
      transitionKernel as string,
      "--out",
      generatedQeiPointwiseTransitionSourceSamples,
      ...auditOnly,
    ]));
  }
  if (
    generatedQeiWorldlineSamplingReceipt != null &&
    inputQeiWorldlineSamplingReceipt == null &&
    inputQeiWorldlineDossier == null
  ) {
    commands.push(command("nhm2:build-qei-worldline-sampling-receipt", [
      "--regional-support-atlas",
      regionalSupportAtlas as string,
      "--source-full-tensor",
      sourceTensor,
      ...(qeiWorldlineSamplePlan == null
        ? []
        : ["--qei-worldline-sample-plan", qeiWorldlineSamplePlan]),
      ...(qeiExplicitWorldlineSamples == null
        ? []
        : [
            "--explicit-worldline-samples",
            qeiExplicitWorldlineSamples,
          ]),
      "--out",
      generatedQeiWorldlineSamplingReceipt,
      ...auditOnly,
    ]));
  }
  if (generatedQeiWorldlineDossier != null && inputQeiWorldlineDossier == null) {
    commands.push(command("nhm2:build-atlas-bound-qei-worldline-dossier", [
      "--regional-support-atlas",
      regionalSupportAtlas as string,
      "--source-full-tensor",
      sourceTensor,
      ...(qeiBoundReceipt == null ? [] : ["--qei-bound-receipt", qeiBoundReceipt]),
      ...(qeiWorldlineSamplingReceipt == null
        ? []
        : ["--qei-worldline-sampling-receipt", qeiWorldlineSamplingReceipt]),
      "--out",
      generatedQeiWorldlineDossier,
      ...auditOnly,
    ]));
  }
  if (
    generatedObserverRobustEnergyConditions != null &&
    inputObserverRobustEnergyConditions == null
  ) {
    commands.push(command("nhm2:build-atlas-bound-observer-robust-energy-conditions", [
      "--regional-support-atlas",
      regionalSupportAtlas as string,
      "--source-full-tensor",
      sourceTensor,
      "--out",
      generatedObserverRobustEnergyConditions,
      ...auditOnly,
    ]));
  }
  commands.push(command("nhm2:build-regional-source-tensor-targets", [
    "--regional-source-closure-evidence",
    regionalEvidence,
    "--out",
    regionalSourceTensorTargets,
  ]));
  commands.push(command("nhm2:build-regional-source-tensor-candidate", [
    "--regional-source-tensor-targets",
    regionalSourceTensorTargets,
    ...(regionalSourceFullTensorTemplate == null
      ? []
      : ["--full-tensor-template", regionalSourceFullTensorTemplate]),
    ...(casimirMaterialReceipt == null
      ? []
      : ["--material-receipt", casimirMaterialReceipt]),
    "--out",
    regionalSourceTensorCandidate,
  ]));
  commands.push(command("nhm2:build-regional-source-tensor-quality-control", [
    "--regional-source-tensor-targets",
    regionalSourceTensorTargets,
    "--regional-source-tensor-candidate",
    regionalSourceTensorCandidate,
    ...(regionalMaterialSourceTensorModel == null
      ? []
      : ["--regional-material-source-tensor-model", regionalMaterialSourceTensorModel]),
    ...(casimirMaterialReceipt == null
      ? []
      : ["--material-receipt", casimirMaterialReceipt]),
    "--out",
    regionalSourceTensorQualityControl,
  ]));
  commands.push(command("nhm2:source-closure-pass-readiness", [
    "--regional-evidence",
    regionalEvidence,
    "--source-authority",
    sourceAuthority,
    "--out-json",
    sourceClosurePassReadiness,
    "--out-md",
    sourceClosurePassReadinessReport,
  ]));
  commands.push(command("nhm2:build-coupled-closure-pass-candidate", [
    ...(regionalSupportAtlas == null
      ? []
      : ["--regional-support-atlas", regionalSupportAtlas]),
    "--tile-effective-counterpart",
    tileCounterpart,
    "--source-component-authority-ledger",
    sourceComponentAuthorityLedger,
    ...(regionalMaterialSourceTensorModel == null
      ? []
      : ["--regional-material-source-tensor-model", regionalMaterialSourceTensorModel]),
    ...(tileLocalSourceElements == null
      ? []
      : ["--tile-local-source-elements", tileLocalSourceElements]),
    "--source-side-authority",
    sourceAuthority,
    "--regional-source-closure-evidence",
    regionalEvidence,
    "--source-closure-pass-readiness",
    sourceClosurePassReadiness,
    ...(conservation == null ? [] : ["--conservation", conservation]),
    ...(qeiWorldlineDossier == null
      ? []
      : ["--qei-worldline-dossier", qeiWorldlineDossier]),
    ...(observerRobustEnergyConditions == null
      ? []
      : ["--observer-robust-energy-conditions", observerRobustEnergyConditions]),
    ...(casimirMaterialReceipt == null
      ? []
      : ["--casimir-material-receipt", casimirMaterialReceipt]),
    "--out",
    coupledClosurePassCandidate,
  ]));
  commands.push(command("nhm2:build-regional-tensor-pass-path-harness", [
    ...(regionalSupportAtlas == null
      ? []
      : ["--regional-support-atlas", regionalSupportAtlas]),
    ...(regionalMaterialSourceTensorModel == null
      ? []
      : ["--regional-material-source-tensor-model", regionalMaterialSourceTensorModel]),
    "--source-component-authority-ledger",
    sourceComponentAuthorityLedger,
    "--source-side-authority",
    sourceAuthority,
    "--regional-source-closure-evidence",
    regionalEvidence,
    "--regional-full-tensor-residual",
    regionalFullTensorResidual,
    "--source-closure-pass-readiness",
    sourceClosurePassReadiness,
    ...(conservation == null ? [] : ["--conservation", conservation]),
    ...(covariantConservationDiagnostic == null
      ? []
      : ["--covariant-conservation-diagnostic", covariantConservationDiagnostic]),
    ...(qeiWorldlineDossier == null
      ? []
      : ["--qei-worldline-dossier", qeiWorldlineDossier]),
    ...(observerRobustEnergyConditions == null
      ? []
      : ["--observer-robust-energy-conditions", observerRobustEnergyConditions]),
    ...(casimirMaterialReceipt == null
      ? []
      : ["--casimir-material-receipt", casimirMaterialReceipt]),
    "--coupled-closure-pass-candidate",
    coupledClosurePassCandidate,
    "--out",
    regionalTensorPassPathHarness,
  ]));
  commands.push(command("nhm2:report-source-to-geometry-divergence", [
    "--regional-evidence",
    regionalEvidence,
    "--out",
    divergenceReport,
  ]));
  commands.push(command("nhm2:audit-tile-effective-counterpart-provenance", [
    "--counterpart",
    tileCounterpart,
    "--out",
    provenanceAudit,
  ]));
  commands.push(command(
    "nhm2:validate-reference-run",
    [
      "--reference-run",
      referenceRun,
      "--regional-evidence",
      regionalEvidence,
      "--tile-effective-counterpart",
      tileCounterpart,
      ...(qeiWorldlineDossier == null
        ? qeiDossier == null
          ? []
          : ["--qei-dossier", qeiDossier]
        : ["--qei-worldline-dossier", qeiWorldlineDossier]),
      "--literature-map",
      literatureMap,
      "--out",
      validation,
    ],
    { allowNonZeroWithOutput: validation },
  ));
  commands.push(command("nhm2:build-reference-run-blocker-ledger", [
    "--reference-run",
    referenceRun,
    "--full-loop-audit",
    fullLoopAudit,
    "--validation",
    validation,
    "--tile-effective-counterpart",
    tileCounterpart,
    "--regional-source-closure-evidence",
    regionalEvidence,
    "--source-divergence-report",
    divergenceReport,
    "--tile-provenance-audit",
    provenanceAudit,
    ...(sourceInput == null ? [] : ["--source-tensor-artifact", sourceTensor]),
    ...(conservation == null ? [] : ["--conservation", conservation]),
    ...(tileLocalSourceElements == null
      ? []
      : ["--tile-local-source-elements", tileLocalSourceElements]),
    "--source-side-authority",
    sourceAuthority,
    "--source-closure-pass-readiness",
    sourceClosurePassReadiness,
    "--coupled-closure-pass-candidate",
    coupledClosurePassCandidate,
    ...(qeiWorldlineDossier == null
      ? qeiDossier == null
        ? []
        : ["--qei-dossier", qeiDossier]
      : ["--qei-worldline-dossier", qeiWorldlineDossier]),
    "--literature-map",
    literatureMap,
    "--out",
    ledger,
    ...auditOnly,
  ]));
  commands.push(command("nhm2:build-full-solve-claim-admission", [
    ...(regionalSupportAtlas == null
      ? []
      : ["--regional-support-atlas", regionalSupportAtlas]),
    "--coupled-closure-pass-candidate",
    coupledClosurePassCandidate,
    "--blocker-ledger",
    ledger,
    "--full-loop-audit",
    fullLoopAudit,
    "--reference-run-validation",
    validation,
    "--out",
    claimAdmission,
  ]));
  commands.push(command("nhm2:render-reference-run-blocker-ledger", [
    "--ledger",
    ledger,
    "--out",
    ledgerReport,
  ]));
  return commands;
};

export const runReferenceValidationChain = (args: Record<string, string | boolean>): void => {
  for (const plannedCommand of planReferenceValidationChain(args)) {
    run(
      plannedCommand.script,
      plannedCommand.args,
      plannedCommand.allowNonZeroWithOutput == null
        ? {}
        : { allowNonZeroWithOutput: plannedCommand.allowNonZeroWithOutput },
    );
  }
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  runReferenceValidationChain(parseArgs(process.argv.slice(2)));
}
