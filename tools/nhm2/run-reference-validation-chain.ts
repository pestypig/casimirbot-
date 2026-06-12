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

export const runReferenceValidationChain = (args: Record<string, string | boolean>): void => {
  const referenceRun = required(args, "reference-run");
  const sourceClosure = required(args, "source-closure");
  const fullLoopAudit = required(args, "full-loop-audit");
  const qeiDossier = typeof args["qei-dossier"] === "string" ? args["qei-dossier"] : null;
  const sourceInput = typeof args["source-input"] === "string" ? args["source-input"] : null;
  const literatureMap =
    typeof args["literature-map"] === "string"
      ? args["literature-map"]
      : "docs/research/nhm2-literature-claim-map.v1.json";
  const outRoot = required(args, "out-root");
  const runId = required(args, "run-id");
  const auditOnly = args["audit-only"] === true ? ["--audit-only"] : [];
  const tileCounterpart = `${outRoot}/nhm2-tile-effective-counterpart.json`;
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

  if (sourceInput != null) {
    run("nhm2:publish-tile-effective-full-tensor-source", [
      "--reference-run",
      referenceRun,
      "--source-input",
      sourceInput,
      ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
      "--out",
      sourceTensor,
      ...auditOnly,
    ]);
    run("nhm2:publish-tile-counterpart-conservation", [
      "--reference-run",
      referenceRun,
      "--tile-full-tensor-source",
      sourceTensor,
      "--out",
      conservation,
      ...auditOnly,
    ]);
    run("nhm2:audit-tile-counterpart-source-independence", [
      "--tile-full-tensor-source",
      sourceTensor,
      "--out",
      sourceIndependenceAudit,
    ]);
  }

  run("nhm2:publish-tile-effective-counterpart", [
    "--reference-run",
    referenceRun,
    "--source-closure",
    sourceClosure,
    ...(qeiDossier == null ? [] : ["--qei-dossier", qeiDossier]),
    ...(sourceInput == null ? [] : ["--tile-full-tensor-source", sourceTensor, "--conservation", conservation]),
    "--out",
    tileCounterpart,
    ...auditOnly,
  ]);
  run("nhm2:publish-source-side-same-basis-authority", [
    "--reference-run",
    referenceRun,
    "--tile-effective-counterpart",
    tileCounterpart,
    "--source-closure",
    sourceClosure,
    "--out",
    sourceAuthority,
    ...auditOnly,
  ]);
  run("nhm2:publish-regional-source-closure-evidence", [
    "--reference-run",
    referenceRun,
    "--source-closure",
    sourceClosure,
    "--tile-effective-counterpart",
    tileCounterpart,
    "--out",
    regionalEvidence,
    ...auditOnly,
  ]);
  run("nhm2:source-closure-pass-readiness", [
    "--regional-evidence",
    regionalEvidence,
    "--source-authority",
    sourceAuthority,
    "--out-json",
    sourceClosurePassReadiness,
    "--out-md",
    sourceClosurePassReadinessReport,
  ]);
  run("nhm2:report-source-to-geometry-divergence", [
    "--regional-evidence",
    regionalEvidence,
    "--out",
    divergenceReport,
  ]);
  run("nhm2:audit-tile-effective-counterpart-provenance", [
    "--counterpart",
    tileCounterpart,
    "--out",
    provenanceAudit,
  ]);
  run(
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
  );
  run("nhm2:build-reference-run-blocker-ledger", [
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
  ]);
  run("nhm2:render-reference-run-blocker-ledger", [
    "--ledger",
    ledger,
    "--out",
    ledgerReport,
  ]);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  runReferenceValidationChain(parseArgs(process.argv.slice(2)));
}
