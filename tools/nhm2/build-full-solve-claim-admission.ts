import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2BlockerLedgerArtifact,
  type Nhm2BlockerLedgerArtifact,
} from "../../shared/contracts/nhm2-blocker-ledger.v1";
import {
  isNhm2CoupledClosurePassCandidateArtifact,
  type Nhm2CoupledClosurePassCandidateArtifactV1,
} from "../../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import {
  buildNhm2FullSolveClaimAdmission,
  isNhm2FullSolveClaimAdmissionArtifact,
  type Nhm2FullSolveClaimAdmissionArtifactV1,
  type Nhm2ReferenceRunValidationAdmissionLike,
} from "../../shared/contracts/nhm2-full-solve-claim-admission.v1";

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

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8")) as unknown;

const isReferenceRunValidationAdmissionLike = (
  value: unknown,
): value is Nhm2ReferenceRunValidationAdmissionLike => {
  const record = asRecord(value);
  return (
    record != null &&
    record.artifactId === "nhm2_reference_run_validation" &&
    record.schemaVersion === "nhm2_reference_run_validation/v1" &&
    typeof record.runId === "string" &&
    (record.overallState === "pass" ||
      record.overallState === "review" ||
      record.overallState === "fail") &&
    record.validationClaimAllowed === false
  );
};

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

const readOptionalRecord = (
  repoRoot: string,
  path: string | null,
  label: string,
): Record<string, unknown> | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`${label} missing: ${path}`);
  }
  const value = readJson(repoRoot, path);
  const record = asRecord(value);
  if (record == null) {
    throw new Error(`${label} must be a JSON object`);
  }
  return record;
};

export const runNhm2FullSolveClaimAdmission = (args: {
  repoRoot: string;
  outPath: string;
  regionalSupportAtlasPath?: string | null;
  coupledClosurePassCandidatePath?: string | null;
  blockerLedgerPath?: string | null;
  fullLoopAuditPath?: string | null;
  referenceRunValidationPath?: string | null;
}): Nhm2FullSolveClaimAdmissionArtifactV1 => {
  const coupledClosurePassCandidate =
    readOptional<Nhm2CoupledClosurePassCandidateArtifactV1>(
      args.repoRoot,
      args.coupledClosurePassCandidatePath ?? null,
      isNhm2CoupledClosurePassCandidateArtifact,
      "coupled closure pass-candidate",
    );
  const blockerLedger = readOptional<Nhm2BlockerLedgerArtifact>(
    args.repoRoot,
    args.blockerLedgerPath ?? null,
    isNhm2BlockerLedgerArtifact,
    "blocker ledger",
  );
  const referenceRunValidation = readOptional<Nhm2ReferenceRunValidationAdmissionLike>(
    args.repoRoot,
    args.referenceRunValidationPath ?? null,
    isReferenceRunValidationAdmissionLike,
    "reference run validation",
  );
  const fullLoopAudit = readOptionalRecord(
    args.repoRoot,
    args.fullLoopAuditPath ?? null,
    "full-loop audit",
  );

  const artifact = buildNhm2FullSolveClaimAdmission({
    artifactRefs: {
      regionalSupportFunctionAtlas: args.regionalSupportAtlasPath ?? null,
      coupledClosurePassCandidate: args.coupledClosurePassCandidatePath ?? null,
      blockerLedger: args.blockerLedgerPath ?? null,
      fullLoopAudit: args.fullLoopAuditPath ?? null,
      referenceRunValidation: args.referenceRunValidationPath ?? null,
    },
    coupledClosurePassCandidate,
    blockerLedger,
    fullLoopAudit,
    referenceRunValidation,
  });
  if (!isNhm2FullSolveClaimAdmissionArtifact(artifact)) {
    throw new Error("built artifact failed nhm2_full_solve_claim_admission/v1 validation");
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
  const artifact = runNhm2FullSolveClaimAdmission({
    repoRoot: process.cwd(),
    outPath,
    regionalSupportAtlasPath: asString(args["regional-support-atlas"]),
    coupledClosurePassCandidatePath: asString(args["coupled-closure-pass-candidate"]),
    blockerLedgerPath: asString(args["blocker-ledger"]),
    fullLoopAuditPath: asString(args["full-loop-audit"]),
    referenceRunValidationPath: asString(args["reference-run-validation"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
