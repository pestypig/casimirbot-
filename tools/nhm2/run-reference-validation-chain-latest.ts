import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "node:path";

type CliArgs = Record<string, string | boolean>;
type InputRefs = Record<string, string | null>;
type AtlasManifestCandidate = {
  path: string;
  generatedAt: string;
  mtimeMs: number;
};

const CLAIM_BOUNDARY = {
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
} as const;

const parseArgs = (argv: string[]): CliArgs => {
  const parsed: CliArgs = {};
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

const asString = (args: CliArgs, key: string): string | null => {
  const value = args[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const readJson = (filePath: string): any => JSON.parse(fs.readFileSync(filePath, "utf8"));

const repoPath = (filePath: string): string => path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

const toRepoRelative = (filePath: string): string => {
  const absolute = repoPath(filePath);
  const relative = path.relative(process.cwd(), absolute);
  return relative.length > 0 && !relative.startsWith("..") ? relative : absolute;
};

const sha256File = (filePath: string): string =>
  createHash("sha256").update(fs.readFileSync(repoPath(filePath))).digest("hex");

const ensureFile = (label: string, filePath: string | null): string => {
  if (filePath == null || filePath.trim().length === 0) throw new Error(`missing_${label}`);
  const absolute = repoPath(filePath);
  if (!fs.existsSync(absolute)) throw new Error(`missing_${label}:${filePath}`);
  return toRepoRelative(absolute);
};

const newestAtlasManifest = (): string | null => {
  const root = path.join(process.cwd(), "artifacts", "research", "full-solve", "rendered", "layered-ledger-atlas");
  if (!fs.existsSync(root)) return null;
  const candidates = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry: fs.Dirent) => entry.isDirectory())
    .map((entry: fs.Dirent) => path.join(root, entry.name, "manifest.json"))
    .filter((candidate: string) => fs.existsSync(candidate))
    .map((candidate: string): AtlasManifestCandidate => {
      let generatedAt = "";
      try {
        generatedAt = String(readJson(candidate)?.generatedAt ?? "");
      } catch {
        generatedAt = "";
      }
      return { path: candidate, generatedAt, mtimeMs: fs.statSync(candidate).mtimeMs };
    });
  if (candidates.length === 0) return null;
  candidates.sort((a: AtlasManifestCandidate, b: AtlasManifestCandidate) => {
    const byGenerated = b.generatedAt.localeCompare(a.generatedAt);
    if (byGenerated !== 0) return byGenerated;
    const byMtime = b.mtimeMs - a.mtimeMs;
    if (byMtime !== 0) return byMtime;
    return b.path.localeCompare(a.path);
  });
  if (
    candidates.length > 1 &&
    candidates[0].generatedAt === candidates[1].generatedAt &&
    candidates[0].mtimeMs === candidates[1].mtimeMs
  ) {
    throw new Error(`ambiguous_latest_atlas_manifest:${candidates[0].path};${candidates[1].path}`);
  }
  return toRepoRelative(candidates[0].path);
};

const latestReferenceLedger = (): string | null => {
  const root = path.join(process.cwd(), "artifacts", "research", "full-solve", "reference");
  if (!fs.existsSync(root)) return null;
  const candidates: Array<{ path: string; generatedAt: string; runId: string; mtimeMs: number }> = [];
  for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const runDir = path.join(root, dir.name);
    for (const file of fs.readdirSync(runDir)) {
      if (!/^nhm2-blocker-ledger-.*\.json$/.test(file)) continue;
      const candidate = path.join(runDir, file);
      let generatedAt = "";
      let runId = "";
      try {
        const json = readJson(candidate);
        generatedAt = String(json.generatedAt ?? "");
        runId = String(json.runId ?? "");
      } catch {
        // Ignore malformed candidates; the selected file is validated later.
      }
      candidates.push({ path: candidate, generatedAt, runId, mtimeMs: fs.statSync(candidate).mtimeMs });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort(
    (
      a: { path: string; generatedAt: string; runId: string; mtimeMs: number },
      b: { path: string; generatedAt: string; runId: string; mtimeMs: number },
    ) => {
    const byGenerated = b.generatedAt.localeCompare(a.generatedAt);
    if (byGenerated !== 0) return byGenerated;
    const byRun = b.runId.localeCompare(a.runId);
    if (byRun !== 0) return byRun;
    const byMtime = b.mtimeMs - a.mtimeMs;
    if (byMtime !== 0) return byMtime;
    return b.path.localeCompare(a.path);
    },
  );
  if (
    candidates.length > 1 &&
    candidates[0].generatedAt === candidates[1].generatedAt &&
    candidates[0].runId === candidates[1].runId &&
    candidates[0].mtimeMs === candidates[1].mtimeMs
  ) {
    throw new Error(`ambiguous_latest_reference_ledger:${candidates[0].path};${candidates[1].path}`);
  }
  return toRepoRelative(candidates[0].path);
};

const artifactSetPath = (referenceRun: any, artifactId: string): string | null => {
  const artifactSet = Array.isArray(referenceRun?.artifactSet) ? referenceRun.artifactSet : [];
  const match = artifactSet.find((entry: any) => entry?.artifactId === artifactId);
  return typeof match?.path === "string" ? match.path : null;
};

const resolveInputs = (args: CliArgs): { runId: string; outRoot: string; inputRefs: InputRefs } => {
  const explicitReferenceRun = asString(args, "reference-run");
  const explicitSourceClosure = asString(args, "source-closure");
  const explicitFullLoopAudit = asString(args, "full-loop-audit");
  const explicitOutRoot = asString(args, "out-root");
  const explicitRunId = asString(args, "run-id");
  const explicitLedger = asString(args, "ledger");
  const explicitRegionalSourceClosure = asString(args, "regional-source-closure-evidence");

  const manifestPath = newestAtlasManifest();
  const manifest = manifestPath == null ? null : readJson(manifestPath);
  const manifestLedger = manifest?.inputRefs?.ledger?.resolvedPath ?? manifest?.inputRefs?.ledger?.path ?? null;
  const manifestRegional =
    manifest?.inputRefs?.regionalSourceClosure?.resolvedPath ?? manifest?.inputRefs?.regionalSourceClosure?.path ?? null;

  const ledgerPath = ensureFile("reference_ledger", explicitLedger ?? manifestLedger ?? latestReferenceLedger());
  const ledger = readJson(ledgerPath);
  const ledgerRunId = String(ledger?.runId ?? manifest?.runId ?? "").trim();

  const referenceRun = ensureFile(
    "reference_run",
    explicitReferenceRun ?? ledger?.artifactRefs?.referenceRun ?? null,
  );
  const referenceRunJson = readJson(referenceRun);
  const sourceClosure = ensureFile(
    "source_closure",
    explicitSourceClosure ?? artifactSetPath(referenceRunJson, "nhm2_source_closure"),
  );
  const fullLoopAudit = ensureFile(
    "full_loop_audit",
    explicitFullLoopAudit ?? ledger?.artifactRefs?.fullLoopAudit ?? artifactSetPath(referenceRunJson, "nhm2_full_loop"),
  );
  const regionalSourceClosure = ensureFile(
    "regional_source_closure_evidence",
    explicitRegionalSourceClosure ??
      ledger?.artifactRefs?.regionalSourceClosureEvidence ??
      manifestRegional,
  );
  const runId = explicitRunId ?? ledgerRunId;
  if (runId.length === 0) throw new Error("missing_run_id");
  const outRoot = explicitOutRoot ?? path.join("artifacts", "research", "full-solve", "validation-chain", runId);

  return {
    runId,
    outRoot: toRepoRelative(outRoot),
    inputRefs: {
      atlasManifest: manifestPath,
      referenceLedger: ledgerPath,
      referenceRun,
      sourceClosure,
      regionalSourceClosure,
      fullLoopAudit,
    },
  };
};

const runChain = async (args: CliArgs): Promise<number> => {
  const resolved = resolveInputs(args);
  const outputRoot = repoPath(resolved.outRoot);
  const logsDir = path.join(outputRoot, "logs");
  fs.mkdirSync(logsDir, { recursive: true });

  const stdoutPath = path.join(logsDir, "reference-validation-chain.stdout.log");
  const stderrPath = path.join(logsDir, "reference-validation-chain.stderr.log");
  const invocationPath = path.join(outputRoot, "reference-validation-chain.invocation.json");
  const stdout = fs.createWriteStream(stdoutPath, { flags: "w" });
  const stderr = fs.createWriteStream(stderrPath, { flags: "w" });
  const startedAt = new Date().toISOString();
  const command = "npm";
  const forwardStringArg = (key: string): string[] => {
    const value = asString(args, key);
    return value == null ? [] : [`--${key}`, value];
  };
  const commandArgs = [
    "run",
    "nhm2:run-reference-validation-chain",
    "--",
    "--reference-run",
    resolved.inputRefs.referenceRun!,
    "--source-closure",
    resolved.inputRefs.sourceClosure!,
    "--full-loop-audit",
    resolved.inputRefs.fullLoopAudit!,
    "--out-root",
    resolved.outRoot,
    "--run-id",
    resolved.runId,
    "--regional-source-closure-evidence",
    resolved.inputRefs.regionalSourceClosure!,
    ...forwardStringArg("qei-dossier"),
    ...forwardStringArg("source-input"),
    ...forwardStringArg("tile-local-source-elements"),
    ...(args["build-tile-local-source-elements"] === true
      ? ["--build-tile-local-source-elements"]
      : []),
    ...forwardStringArg("casimir-material-receipt"),
    ...forwardStringArg("wall-material-source-tensor-model"),
    ...forwardStringArg("wall-source-component-model"),
    ...forwardStringArg("regional-material-source-tensor-model"),
    ...forwardStringArg("regional-source-component-model"),
    ...forwardStringArg("layered-wall-source-candidate"),
    ...forwardStringArg("layered-wall-source-candidate-row-id"),
    ...forwardStringArg("layered-wall-volume-mode"),
    ...forwardStringArg("literature-map"),
    ...(args["audit-only"] === true ? ["--audit-only"] : []),
  ];

  let exitCode: number | null = null;
  const child = spawn(command, commandArgs, {
    cwd: process.cwd(),
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk: Buffer) => {
    process.stdout.write(chunk);
    stdout.write(chunk);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk);
    stderr.write(chunk);
  });

  await new Promise<void>((resolve: () => void) => {
    child.on("close", (code: number | null) => {
      exitCode = code;
      resolve();
    });
  });

  await new Promise<void>((resolve: () => void) => stdout.end(resolve));
  await new Promise<void>((resolve: () => void) => stderr.end(resolve));

  const finishedAt = new Date().toISOString();
  const inputHashes = Object.fromEntries(
    Object.entries(resolved.inputRefs).map(([key, value]: [string, string | null]) => [
      key,
      value == null ? null : sha256File(value),
    ]),
  );
  const invocation = {
    command,
    args: commandArgs,
    cwd: process.cwd(),
    startedAt,
    finishedAt,
    exitCode,
    inputRefs: resolved.inputRefs,
    inputHashes,
    outputRoot: resolved.outRoot,
    claimBoundary: CLAIM_BOUNDARY,
  };
  fs.writeFileSync(invocationPath, `${JSON.stringify(invocation, null, 2)}\n`, "utf8");
  return exitCode ?? 1;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  runChain(parseArgs(process.argv.slice(2)))
    .then((code: number) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${JSON.stringify({ ok: false, error: message, claimBoundary: CLAIM_BOUNDARY }, null, 2)}\n`);
      process.exitCode = 1;
    });
}
