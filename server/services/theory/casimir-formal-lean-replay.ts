import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  buildCasimirFormalVerificationCertificateV1,
  validateCasimirFormalVerificationCertificateAgainstRequestV1,
  validateCasimirFormalVerificationCertificateIntegrityV1,
  type CasimirFormalVerificationCertificateV1,
} from "../../../shared/contracts/casimir-formal-verification-certificate.v1";
import {
  validateCasimirFormalLeanReplayPolicyIntegrityV1,
  type CasimirFormalLeanReplayPolicyV1,
} from "../../../shared/contracts/casimir-formal-lean-replay-policy.v1";
import {
  validateCasimirFormalVerificationRequestIntegrityV1,
  type CasimirFormalVerificationRequestV1,
} from "../../../shared/contracts/casimir-formal-verification-request.v1";
import { computeCasimirSpecValueSha256V1 } from "../../../shared/contracts/casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_FORMAL_LEAN_REPLAY_BACKEND_ID =
  "casimir_formal_lean_replay_backend/v1" as const;

export type CasimirFormalLeanProcessRunInputV1 = {
  command: string;
  args: string[];
  cwd: string;
  environment: Record<string, string>;
  timeoutMs: number;
  maxOutputBytes: number;
};

export type CasimirFormalLeanProcessObservationV1 = {
  startedAt: string;
  completedAt: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  outputLimitExceeded: boolean;
  spawnError: string | null;
};

export type CasimirFormalLeanProcessRunnerV1 = (
  input: CasimirFormalLeanProcessRunInputV1,
) => Promise<CasimirFormalLeanProcessObservationV1>;

export type ReplayCasimirFormalLeanRequestV1Input = {
  request: CasimirFormalVerificationRequestV1;
  policy: CasimirFormalLeanReplayPolicyV1;
  leanExecutablePath: string;
  theoremSourcePath: string;
  importSourcePaths: Record<string, string>;
  outputRoot: string;
  runner?: CasimirFormalLeanProcessRunnerV1;
  generatedAt?: () => string;
};

export class CasimirFormalLeanReplayAdmissionError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`formal Lean replay admission failed: ${issues.join("; ")}`);
    this.name = "CasimirFormalLeanReplayAdmissionError";
    this.issues = [...issues];
  }
}

type ReplayRun = {
  replayIndex: 1 | 2;
  observation: CasimirFormalLeanProcessObservationV1;
  stdoutSha256: string;
  stderrSha256: string;
  transcriptSha256: string;
};

const SHA256 = /^[a-f0-9]{64}$/;
const LEAN_MODULE = /^[A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)*$/;
const LEAN_NAME = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const MEBIBYTE = 1024 * 1024;

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");
const sortedUnique = (values: string[]): string[] =>
  [...new Set(values)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function portableModulePath(moduleName: string): string {
  return `${moduleName.replaceAll(".", "/")}.lean`;
}

function parseDeclaredImports(source: string): {
  modules: string[];
  invalidImportLines: string[];
} {
  const modules: string[] = [];
  const invalidImportLines: string[] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!/^\s*import\b/.test(line)) continue;
    const match = line.match(
      /^\s*import\s+([A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)*)\s*$/,
    );
    if (!match) invalidImportLines.push(line.trim());
    else modules.push(match[1]);
  }
  return { modules: sortedUnique(modules), invalidImportLines };
}

function validateSourceAdmission(
  sourceBytes: Buffer,
  request: CasimirFormalVerificationRequestV1,
  policy: CasimirFormalLeanReplayPolicyV1,
): { source: string; issues: string[] } {
  const issues: string[] = [];
  let source = "";
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
  } catch {
    return { source, issues: ["source_utf8_invalid"] };
  }
  if (source.charCodeAt(0) === 0xfeff) issues.push("source_bom_forbidden");
  if (sourceBytes.byteLength > policy.resourceCeilings.maxSourceBytes) {
    issues.push("source_size_limit_exceeded");
  }
  if (sha256(sourceBytes) !== request.formalArtifact.sourceSha256) {
    issues.push("source_hash_mismatch");
  }
  for (const token of policy.sourceAdmission.forbiddenTokens) {
    const tokenPattern = token.startsWith("#")
      ? new RegExp(escapeRegExp(token), "u")
      : new RegExp(`\\b${escapeRegExp(token)}\\b`, "u");
    if (tokenPattern.test(source)) {
      issues.push(`source_token_forbidden:${token}`);
    }
  }
  const imports = parseDeclaredImports(source);
  if (imports.invalidImportLines.length > 0) {
    issues.push("source_import_syntax_not_admitted");
  }
  const requestedImports = request.formalEnvironment.imports.map(
    (entry) => entry.module,
  );
  if (JSON.stringify(imports.modules) !== JSON.stringify(requestedImports)) {
    issues.push("source_import_set_mismatch");
  }
  const allowed = new Set(policy.allowedImportModules);
  for (const moduleName of imports.modules) {
    if (!allowed.has(moduleName))
      issues.push(`source_import_not_allowed:${moduleName}`);
  }
  if (!LEAN_MODULE.test(request.formalArtifact.theoremModule)) {
    issues.push("theorem_module_invalid");
  }
  if (!LEAN_NAME.test(request.formalArtifact.theoremName)) {
    issues.push("theorem_name_invalid");
  }
  return { source, issues };
}

async function requireRegularNonAliasedFile(
  inputPath: string,
  label: string,
): Promise<{ absolutePath: string; bytes: Buffer }> {
  if (!path.isAbsolute(inputPath)) {
    throw new Error(`${label}_path_not_absolute`);
  }
  const absolutePath = path.resolve(inputPath);
  const stat = await fs.lstat(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label}_not_regular_file`);
  }
  const realPath = await fs.realpath(absolutePath);
  const same =
    process.platform === "win32"
      ? realPath.toLowerCase() === absolutePath.toLowerCase()
      : realPath === absolutePath;
  if (!same) throw new Error(`${label}_path_alias_forbidden`);
  return { absolutePath, bytes: await fs.readFile(absolutePath) };
}

async function requireFreshOutputRoot(outputRoot: string): Promise<string> {
  if (!path.isAbsolute(outputRoot)) throw new Error("output_root_not_absolute");
  const absolutePath = path.resolve(outputRoot);
  try {
    await fs.lstat(absolutePath);
    throw new Error("output_root_must_not_exist");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      await fs.mkdir(absolutePath);
      return absolutePath;
    }
    throw error;
  }
}

function appendBounded(
  chunks: Buffer[],
  chunk: Buffer,
  state: { captured: number; limit: number },
): boolean {
  const remaining = Math.max(0, state.limit - state.captured);
  if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
  state.captured += Math.min(remaining, chunk.byteLength);
  return chunk.byteLength > remaining;
}

export const runCasimirFormalLeanProcessV1: CasimirFormalLeanProcessRunnerV1 =
  async (input) => {
    const startedAt = new Date().toISOString();
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const capture = { captured: 0, limit: input.maxOutputBytes };
    let timedOut = false;
    let outputLimitExceeded = false;
    let spawnError: string | null = null;
    let exitCode: number | null = null;
    let signal: NodeJS.Signals | null = null;

    await new Promise<void>((resolve) => {
      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(input.command, input.args, {
          cwd: input.cwd,
          env: { ...input.environment },
          shell: false,
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        spawnError = error instanceof Error ? error.message : String(error);
        resolve();
        return;
      }
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, input.timeoutMs);
      child.stdout?.on("data", (value: Buffer | string) => {
        const exceeded = appendBounded(
          stdoutChunks,
          Buffer.isBuffer(value) ? value : Buffer.from(value),
          capture,
        );
        if (exceeded) {
          outputLimitExceeded = true;
          child.kill("SIGKILL");
        }
      });
      child.stderr?.on("data", (value: Buffer | string) => {
        const exceeded = appendBounded(
          stderrChunks,
          Buffer.isBuffer(value) ? value : Buffer.from(value),
          capture,
        );
        if (exceeded) {
          outputLimitExceeded = true;
          child.kill("SIGKILL");
        }
      });
      child.once("error", (error) => {
        spawnError = error.message;
      });
      child.once("close", (code, closeSignal) => {
        clearTimeout(timeout);
        exitCode = code;
        signal = closeSignal;
        resolve();
      });
    });
    return {
      startedAt,
      completedAt: new Date().toISOString(),
      exitCode,
      signal,
      stdout: Buffer.concat(stdoutChunks).toString("utf8"),
      stderr: Buffer.concat(stderrChunks).toString("utf8"),
      timedOut,
      outputLimitExceeded,
      spawnError,
    };
  };

function parseAxiomReport(
  transcript: string,
  theoremName: string,
): { found: boolean; usedAxiomIds: string[] } {
  const noAxioms = new RegExp(
    `'${escapeRegExp(theoremName)}' does not depend on any axioms`,
    "u",
  );
  if (noAxioms.test(transcript)) return { found: true, usedAxiomIds: [] };
  const depends = new RegExp(
    `'${escapeRegExp(theoremName)}' depends on axioms:\\s*\\[([^\\]]*)\\]`,
    "u",
  ).exec(transcript);
  if (!depends) return { found: false, usedAxiomIds: [] };
  return {
    found: true,
    usedAxiomIds: sortedUnique(
      depends[1]
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  };
}

function theoremCheckObserved(
  transcript: string,
  theoremName: string,
): boolean {
  return new RegExp(`(?:^|\\r?\\n)${escapeRegExp(theoremName)}\\s*:`, "u").test(
    transcript,
  );
}

async function replayRun(
  replayIndex: 1 | 2,
  input: {
    runner: CasimirFormalLeanProcessRunnerV1;
    executablePath: string;
    sourceBytes: Buffer;
    sourceRelativePath: string;
    theoremName: string;
    outputRoot: string;
    timeoutMs: number;
    maxMemoryBytes: number;
    maxOutputBytes: number;
  },
): Promise<ReplayRun> {
  const workdir = path.join(input.outputRoot, `replay-${replayIndex}`);
  await fs.mkdir(path.dirname(path.join(workdir, input.sourceRelativePath)), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(workdir, input.sourceRelativePath),
    input.sourceBytes,
  );
  const wrapperSuffix = [
    "",
    `#check ${input.theoremName}`,
    `#print axioms ${input.theoremName}`,
    "",
  ].join("\n");
  await fs.writeFile(
    path.join(workdir, "CasimirReplay.lean"),
    Buffer.concat([input.sourceBytes, Buffer.from(wrapperSuffix, "utf8")]),
  );
  const memoryMiB = Math.max(1, Math.floor(input.maxMemoryBytes / MEBIBYTE));
  const observation = await input.runner({
    command: input.executablePath,
    args: [
      "--trust=0",
      "--threads=1",
      `--memory=${memoryMiB}`,
      "--root=.",
      "CasimirReplay.lean",
    ],
    cwd: workdir,
    environment: { LEAN_PATH: workdir },
    timeoutMs: input.timeoutMs,
    maxOutputBytes: input.maxOutputBytes,
  });
  const stdoutSha256 = sha256(observation.stdout);
  const stderrSha256 = sha256(observation.stderr);
  return {
    replayIndex,
    observation,
    stdoutSha256,
    stderrSha256,
    transcriptSha256: await computeCasimirSpecValueSha256V1({
      stdoutSha256,
      stderrSha256,
    }),
  };
}

function runBlockers(
  run: ReplayRun,
  theoremName: string,
): Array<{ code: string; message: string; evidenceRefs: string[] }> {
  const blockers: Array<{
    code: string;
    message: string;
    evidenceRefs: string[];
  }> = [];
  if (run.observation.spawnError) {
    blockers.push({
      code: "lean_spawn_failed",
      message: run.observation.spawnError,
      evidenceRefs: [],
    });
  }
  if (run.observation.timedOut) {
    blockers.push({
      code: "lean_replay_timed_out",
      message: `Lean replay ${run.replayIndex} exceeded its wall timeout.`,
      evidenceRefs: [],
    });
  }
  if (run.observation.outputLimitExceeded) {
    blockers.push({
      code: "lean_output_limit_exceeded",
      message: `Lean replay ${run.replayIndex} exceeded its output limit.`,
      evidenceRefs: [],
    });
  }
  if (run.observation.exitCode !== 0 || run.observation.signal !== null) {
    blockers.push({
      code: "lean_replay_failed",
      message: `Lean replay ${run.replayIndex} exited nonzero or by signal.`,
      evidenceRefs: [],
    });
  }
  const transcript = `${run.observation.stdout}\n${run.observation.stderr}`;
  if (!theoremCheckObserved(transcript, theoremName)) {
    blockers.push({
      code: "lean_theorem_check_missing",
      message: `Lean replay ${run.replayIndex} did not print the exact theorem check.`,
      evidenceRefs: [],
    });
  }
  if (!parseAxiomReport(transcript, theoremName).found) {
    blockers.push({
      code: "lean_axiom_report_missing",
      message: `Lean replay ${run.replayIndex} did not print an exact axiom report.`,
      evidenceRefs: [],
    });
  }
  return blockers;
}

async function buildCertificate(input: {
  request: CasimirFormalVerificationRequestV1;
  policy: CasimirFormalLeanReplayPolicyV1;
  runs: ReplayRun[];
  blockers: Array<{ code: string; message: string; evidenceRefs: string[] }>;
  usedAxiomIds: string[];
  generatedAt: string;
}): Promise<CasimirFormalVerificationCertificateV1> {
  const byteIdentical =
    input.runs.length === 2 &&
    input.runs[0].stdoutSha256 === input.runs[1].stdoutSha256 &&
    input.runs[0].stderrSha256 === input.runs[1].stderrSha256;
  const hiddenAxiomsDetected = input.usedAxiomIds.some(
    (axiomId) =>
      !input.request.formalEnvironment.allowedAxiomIds.includes(axiomId),
  );
  const blockers = [...input.blockers];
  if (input.runs.length === 2 && !byteIdentical) {
    blockers.push({
      code: "lean_replay_nondeterministic",
      message:
        "The two outer-observed Lean transcripts were not byte-identical.",
      evidenceRefs: [],
    });
  }
  if (hiddenAxiomsDetected) {
    blockers.push({
      code: "lean_hidden_axiom_detected",
      message: "Lean reported an axiom outside the request allowlist.",
      evidenceRefs: [],
    });
  }
  const passed =
    input.runs.length === 2 && byteIdentical && blockers.length === 0;
  const aggregateTranscriptSha256 = await computeCasimirSpecValueSha256V1(
    input.runs.map((run) => ({
      replayIndex: run.replayIndex,
      stdoutSha256: run.stdoutSha256,
      stderrSha256: run.stderrSha256,
      transcriptSha256: run.transcriptSha256,
    })),
  );
  const reportSha256 = await computeCasimirSpecValueSha256V1({
    declaredAxiomIds: input.request.formalEnvironment.declaredAxiomIds,
    allowedAxiomIds: input.request.formalEnvironment.allowedAxiomIds,
    usedAxiomIds: input.usedAxiomIds,
    hiddenAxiomsDetected,
  });
  return buildCasimirFormalVerificationCertificateV1({
    generatedAt: input.generatedAt,
    certificateId: `lean-replay:${input.request.requestId}`,
    request: {
      schemaVersion: input.request.schemaVersion,
      requestId: input.request.requestId,
      artifactSha256: input.request.artifactSha256,
      propositionSha256: input.request.claim.propositionSha256,
      casimirSpec: {
        semanticSha256: input.request.casimirSpec.semanticSha256,
        artifactSha256: input.request.casimirSpec.artifactSha256,
      },
      masterProblem: {
        planId: input.request.masterProblem.planId,
        artifactSha256: input.request.masterProblem.artifactSha256,
      },
      derivationProgram: {
        programId: input.request.derivationProgram.programId,
        artifactSha256: input.request.derivationProgram.artifactSha256,
      },
      theoryGraph: {
        graphId: input.request.theoryGraph.graphId,
        snapshotSha256: input.request.theoryGraph.snapshotSha256,
      },
    },
    status: passed ? "passed" : input.runs.length === 0 ? "blocked" : "failed",
    theorem: {
      claimId: input.request.claim.claimId,
      theoremName: input.request.formalArtifact.theoremName,
      statementSha256: input.request.formalArtifact.statementSha256,
      emittedSourceSha256: input.request.formalArtifact.sourceSha256,
    },
    environment: {
      prover: "lean4",
      pinnedVersion: input.policy.pinnedVersion,
      toolchainPolicySha256: input.policy.artifactSha256,
      kernelBinarySha256: input.policy.kernelBinarySha256,
      imports: input.request.formalEnvironment.imports,
    },
    replay: {
      observationMode: "outer_observed_process",
      requiredReplayCount: 2,
      completedReplayCount: input.runs.length,
      byteIdentical,
      aggregateTranscriptSha256,
      runs: input.runs.map((run) => ({
        replayIndex: run.replayIndex,
        exitCode: run.observation.exitCode ?? -1,
        stdoutSha256: run.stdoutSha256,
        stderrSha256: run.stderrSha256,
        transcriptSha256: run.transcriptSha256,
        startedAt: run.observation.startedAt,
        completedAt: run.observation.completedAt,
      })),
    },
    axiomAudit: {
      declaredAxiomIds: input.request.formalEnvironment.declaredAxiomIds,
      allowedAxiomIds: input.request.formalEnvironment.allowedAxiomIds,
      usedAxiomIds: input.usedAxiomIds,
      hiddenAxiomsDetected,
      reportSha256,
    },
    blockers: blockers.sort((left, right) =>
      left.code < right.code ? -1 : left.code > right.code ? 1 : 0,
    ),
  });
}

export async function replayCasimirFormalLeanRequestV1(
  input: ReplayCasimirFormalLeanRequestV1Input,
): Promise<CasimirFormalVerificationCertificateV1> {
  const admissionIssues = [
    ...(
      await validateCasimirFormalVerificationRequestIntegrityV1(input.request)
    ).map((issue) => `request:${issue}`),
    ...(
      await validateCasimirFormalLeanReplayPolicyIntegrityV1(input.policy)
    ).map((issue) => `policy:${issue}`),
  ];
  if (
    input.request.formalEnvironment.toolchainPolicyId !== input.policy.policyId
  ) {
    admissionIssues.push("request:toolchain policy ID mismatch");
  }
  if (
    input.request.formalEnvironment.toolchainPolicySha256 !==
    input.policy.artifactSha256
  ) {
    admissionIssues.push("request:toolchain policy hash mismatch");
  }
  if (
    input.request.formalEnvironment.pinnedVersion !== input.policy.pinnedVersion
  ) {
    admissionIssues.push("request:pinned Lean version mismatch");
  }
  if (
    input.request.executionPolicy.timeoutMs >
    input.policy.resourceCeilings.timeoutMs
  ) {
    admissionIssues.push("request:timeout exceeds policy ceiling");
  }
  if (
    input.request.executionPolicy.maxMemoryBytes >
    input.policy.resourceCeilings.maxMemoryBytes
  ) {
    admissionIssues.push("request:memory exceeds policy ceiling");
  }
  if (
    input.request.executionPolicy.maxOutputBytes >
    input.policy.resourceCeilings.maxOutputBytes
  ) {
    admissionIssues.push("request:output exceeds policy ceiling");
  }
  if (
    input.request.formalEnvironment.imports.length >
    input.policy.resourceCeilings.maxImportCount
  ) {
    admissionIssues.push("request:import count exceeds policy ceiling");
  }
  if (admissionIssues.length > 0) {
    throw new CasimirFormalLeanReplayAdmissionError(admissionIssues);
  }

  const now = input.generatedAt ?? (() => new Date().toISOString());
  const blockers: Array<{
    code: string;
    message: string;
    evidenceRefs: string[];
  }> = [];
  let executable: Awaited<ReturnType<typeof requireRegularNonAliasedFile>>;
  let source: Awaited<ReturnType<typeof requireRegularNonAliasedFile>>;
  try {
    executable = await requireRegularNonAliasedFile(
      input.leanExecutablePath,
      "lean_executable",
    );
    source = await requireRegularNonAliasedFile(
      input.theoremSourcePath,
      "theorem_source",
    );
  } catch (error) {
    blockers.push({
      code: "sealed_input_invalid",
      message: error instanceof Error ? error.message : String(error),
      evidenceRefs: [],
    });
    return buildCertificate({
      request: input.request,
      policy: input.policy,
      runs: [],
      blockers,
      usedAxiomIds: [],
      generatedAt: now(),
    });
  }
  if (sha256(executable.bytes) !== input.policy.kernelBinarySha256) {
    blockers.push({
      code: "lean_binary_hash_mismatch",
      message: "Observed Lean executable bytes do not match the replay policy.",
      evidenceRefs: [],
    });
  }
  const sourceAdmission = validateSourceAdmission(
    source.bytes,
    input.request,
    input.policy,
  );
  blockers.push(
    ...sourceAdmission.issues.map((issue) => ({
      code: issue.split(":")[0],
      message: issue,
      evidenceRefs: [] as string[],
    })),
  );

  const expectedImportModules = input.request.formalEnvironment.imports.map(
    (entry) => entry.module,
  );
  const suppliedImportModules = Object.keys(input.importSourcePaths).sort();
  if (
    JSON.stringify(expectedImportModules) !==
    JSON.stringify(suppliedImportModules)
  ) {
    blockers.push({
      code: "import_source_map_mismatch",
      message: "Import source paths must exactly cover the request imports.",
      evidenceRefs: [],
    });
  } else {
    for (const entry of input.request.formalEnvironment.imports) {
      try {
        const observed = await requireRegularNonAliasedFile(
          input.importSourcePaths[entry.module],
          `import_source_${entry.module}`,
        );
        if (sha256(observed.bytes) !== entry.sourceSha256) {
          blockers.push({
            code: "import_source_hash_mismatch",
            message: `Import source hash does not match for ${entry.module}.`,
            evidenceRefs: [],
          });
        }
      } catch (error) {
        blockers.push({
          code: "import_source_invalid",
          message: error instanceof Error ? error.message : String(error),
          evidenceRefs: [],
        });
      }
    }
  }
  if (blockers.length > 0) {
    return buildCertificate({
      request: input.request,
      policy: input.policy,
      runs: [],
      blockers,
      usedAxiomIds: [],
      generatedAt: now(),
    });
  }

  let outputRoot: string;
  try {
    outputRoot = await requireFreshOutputRoot(input.outputRoot);
  } catch (error) {
    return buildCertificate({
      request: input.request,
      policy: input.policy,
      runs: [],
      blockers: [
        {
          code: "output_root_invalid",
          message: error instanceof Error ? error.message : String(error),
          evidenceRefs: [],
        },
      ],
      usedAxiomIds: [],
      generatedAt: now(),
    });
  }
  const runner = input.runner ?? runCasimirFormalLeanProcessV1;
  const runs: ReplayRun[] = [];
  const sourceRelativePath = portableModulePath(
    input.request.formalArtifact.theoremModule,
  );
  for (const replayIndex of [1, 2] as const) {
    const run = await replayRun(replayIndex, {
      runner,
      executablePath: executable.absolutePath,
      sourceBytes: source.bytes,
      sourceRelativePath,
      theoremName: input.request.formalArtifact.theoremName,
      outputRoot,
      timeoutMs: input.request.executionPolicy.timeoutMs,
      maxMemoryBytes: input.request.executionPolicy.maxMemoryBytes,
      maxOutputBytes: input.request.executionPolicy.maxOutputBytes,
    });
    runs.push(run);
    blockers.push(
      ...runBlockers(run, input.request.formalArtifact.theoremName),
    );
    if (blockers.length > 0) break;
    const [currentExecutable, currentSource] = await Promise.all([
      fs.readFile(executable.absolutePath),
      fs.readFile(source.absolutePath),
    ]);
    if (sha256(currentExecutable) !== input.policy.kernelBinarySha256) {
      blockers.push({
        code: "lean_binary_changed_during_replay",
        message: "Lean executable bytes changed during replay.",
        evidenceRefs: [],
      });
    }
    if (sha256(currentSource) !== input.request.formalArtifact.sourceSha256) {
      blockers.push({
        code: "theorem_source_changed_during_replay",
        message: "Theorem source bytes changed during replay.",
        evidenceRefs: [],
      });
    }
    if (blockers.length > 0) break;
  }

  let usedAxiomIds: string[] = [];
  if (runs.length > 0) {
    const report = parseAxiomReport(
      `${runs[0].observation.stdout}\n${runs[0].observation.stderr}`,
      input.request.formalArtifact.theoremName,
    );
    usedAxiomIds = report.usedAxiomIds;
  }
  const certificate = await buildCertificate({
    request: input.request,
    policy: input.policy,
    runs,
    blockers,
    usedAxiomIds,
    generatedAt: now(),
  });
  const certificateIssues = [
    ...(await validateCasimirFormalVerificationCertificateIntegrityV1(
      certificate,
    )),
    ...validateCasimirFormalVerificationCertificateAgainstRequestV1(
      certificate,
      input.request,
    ),
  ];
  if (certificateIssues.length > 0) {
    throw new Error(
      `formal Lean replay produced an invalid certificate: ${certificateIssues.join("; ")}`,
    );
  }
  return certificate;
}
