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
  const sourceClosure = required(args, "source-closure");
  const fullLoopAudit = required(args, "full-loop-audit");
  const qeiDossier = asOptionalString(args, "qei-dossier");
  const sourceInput = asOptionalString(args, "source-input");
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
  const tileCounterpart = `${outRoot}/nhm2-tile-effective-counterpart.json`;
  const generatedTileLocalSourceElements = `${outRoot}/nhm2-tile-local-source-elements.json`;
  const tileLocalSourceElements =
    inputTileLocalSourceElements ??
    (buildTileLocalSourceElements ? generatedTileLocalSourceElements : null);
  const sourceTensor = `${outRoot}/nhm2-tile-effective-full-tensor-source.json`;
  const conservation = `${outRoot}/nhm2-tile-counterpart-conservation.json`;
  const sourceIndependenceAudit = `${outRoot}/nhm2-tile-counterpart-source-independence.md`;
  const sourceAuthority = `${outRoot}/nhm2-source-side-same-basis-tensor-authority.json`;
  const regionalEvidence = `${outRoot}/nhm2-regional-source-closure-evidence.json`;
  const sourceClosurePassReadiness = `${outRoot}/nhm2-source-closure-pass-readiness.json`;
  const sourceClosurePassReadinessReport = `${outRoot}/nhm2-source-closure-pass-readiness.md`;
  const divergenceReport = `${outRoot}/nhm2-source-to-geometry-divergence.md`;
  const provenanceAudit = `${outRoot}/nhm2-tile-counterpart-provenance.md`;
  const validation = `${outRoot}/nhm2-reference-run-validation.json`;
  const ledger = `${outRoot}/nhm2-blocker-ledger-${runId}.json`;
  const ledgerReport = `${outRoot}/nhm2-blocker-ledger-${runId}.md`;
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
  const layeredWallFullTensorAudit =
    `${outRoot}/nhm2-layered-wall-full-tensor-source-audit.json`;
  const layeredWallSourceTensorCandidate =
    `${outRoot}/nhm2-layered-wall-source-tensor-candidate.json`;

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
  if (wallMaterialSourceTensorModel != null && !buildTileLocalSourceElements) {
    throw new Error(
      "--wall-material-source-tensor-model or --wall-source-component-model requires --build-tile-local-source-elements so the source tensor model is consumed",
    );
  }

  if (sourceInput != null) {
    commands.push(command("nhm2:publish-tile-effective-full-tensor-source", [
      "--reference-run",
      referenceRun,
      "--source-input",
      sourceInput,
      ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
      "--out",
      sourceTensor,
      ...auditOnly,
    ]));
    commands.push(command("nhm2:publish-tile-counterpart-conservation", [
      "--reference-run",
      referenceRun,
      "--tile-full-tensor-source",
      sourceTensor,
      "--out",
      conservation,
      ...auditOnly,
    ]));
    commands.push(command("nhm2:audit-tile-counterpart-source-independence", [
      "--tile-full-tensor-source",
      sourceTensor,
      "--out",
      sourceIndependenceAudit,
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
        ...(sourceInput == null ? [] : ["--conservation", conservation]),
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
      ...(sourceInput == null ? [] : ["--tile-full-tensor-source", sourceTensor, "--conservation", conservation]),
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
  commands.push(command("nhm2:publish-regional-source-closure-evidence", [
    "--reference-run",
    referenceRun,
    "--source-closure",
    sourceClosure,
    "--tile-effective-counterpart",
    tileCounterpart,
    "--out",
    regionalEvidence,
    ...auditOnly,
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
      ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
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
    ...(sourceInput == null
      ? []
      : ["--source-tensor-artifact", sourceTensor, "--conservation", conservation]),
    ...(tileLocalSourceElements == null
      ? []
      : ["--tile-local-source-elements", tileLocalSourceElements]),
    "--source-side-authority",
    sourceAuthority,
    "--source-closure-pass-readiness",
    sourceClosurePassReadiness,
    ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
    "--literature-map",
    literatureMap,
    "--out",
    ledger,
    ...auditOnly,
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
