import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const INITIAL_CANONICAL_COMMANDS = [
  ['run', 'warp:full-solve:canonical'],
  ['run', 'warp:full-solve:g4-sensitivity'],
] as const;

const FINALIZATION_COMMANDS = [
  ['run', 'warp:full-solve:g4-recovery-search'],
  ['run', 'warp:full-solve:g4-recovery-parity'],
  ['run', 'warp:full-solve:g4-governance-matrix'],
  ['run', 'warp:full-solve:g4-decision-ledger'],
  ['run', 'warp:full-solve:canonical'],
] as const;

const LEDGER_PATH = path.join('artifacts', 'research', 'full-solve', 'g4-decision-ledger-2026-02-26.json');
const MATRIX_PATH = path.join('artifacts', 'research', 'full-solve', 'g4-governance-matrix-2026-02-27.json');
const RECOVERY_PATH = path.join('artifacts', 'research', 'full-solve', 'g4-recovery-search-2026-02-27.json');
const PARITY_PATH = path.join('artifacts', 'research', 'full-solve', 'g4-recovery-parity-2026-02-27.json');
const DEFAULT_COMMAND_TIMEOUT_MS = 8 * 60_000;
const DEFAULT_MAX_RETRIES = 1;

export type CanonicalBundleResult = {
  ok: boolean;
  boundaryStatement: string;
  headCommitHash: string;
  ledgerPath: string;
  matrixPath: string;
  recoveryPath: string;
  parityPath: string;
};

type RunCommandOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  runSpawnSync?: (command: string, args: string[], options: Record<string, unknown>) => SpawnSyncReturns<Buffer>;
};

const npmCli = process.env.npm_execpath;

const readJson = (filePath: string): any => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const readCommitHash = (payload: any): string | null => {
  const commitHash = payload?.commitHash ?? payload?.provenance?.commitHash;
  return typeof commitHash === 'string' && commitHash.trim().length > 0 ? commitHash.trim() : null;
};

const hasTimedOut = (result: SpawnSyncReturns<Buffer>): boolean => {
  const message = String(result.error?.message ?? '').toLowerCase();
  return message.includes('timed out') || message.includes('etimedout');
};

export const runCommandWithRetry = (args: readonly string[], options: RunCommandOptions = {}) => {
  const timeoutMs = Math.max(1_000, Number(options.timeoutMs ?? process.env.WARP_CANONICAL_BUNDLE_TIMEOUT_MS ?? DEFAULT_COMMAND_TIMEOUT_MS));
  const maxRetries = Math.max(0, Number(options.maxRetries ?? process.env.WARP_CANONICAL_BUNDLE_MAX_RETRIES ?? DEFAULT_MAX_RETRIES));
  const runSpawnSync = options.runSpawnSync ?? ((command, commandArgs, spawnOptions) => spawnSync(command, commandArgs, spawnOptions as any));
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const commandArgs = npmCli ? [npmCli, ...args] : [...args];
  const commandLabel = `npm ${args.join(' ')}`;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const result = runSpawnSync(command, commandArgs, {
      stdio: 'inherit',
      shell: false,
      timeout: timeoutMs,
    });
    if (result.status === 0) {
      return;
    }

    const timedOut = hasTimedOut(result);
    const spawnError = result.error ? `;error=${result.error.message}` : '';
    const reason = timedOut
      ? `timeout after ${timeoutMs}ms`
      : `exit=${result.status ?? 'null'}${result.signal ? `;signal=${result.signal}` : ''}${spawnError}`;

    if (timedOut) {
      throw new Error(`Command failed (${commandLabel}) with ${reason}; timeoutMs=${timeoutMs}`);
    }

    if (attempt < maxRetries) {
      console.warn(
        `[warp-full-solve-canonical-bundle] transient failure, retrying (${attempt + 1}/${maxRetries}) for ${commandLabel}: ${reason}`,
      );
      continue;
    }

    throw new Error(`Command failed (${commandLabel}) with ${reason}; timeoutMs=${timeoutMs}`);
  }
};

export const assertBundleProvenanceFresh = (headCommitHash: string, ledger: any, matrix: any, recovery: any, parity: any) => {
  const ledgerCommitHash = readCommitHash(ledger);
  const matrixCommitHash = readCommitHash(matrix);
  const recoveryCommitHash = readCommitHash(recovery);
  const parityCommitHash = readCommitHash(parity);

  if (ledgerCommitHash !== headCommitHash) {
    throw new Error(`Ledger commit hash mismatch: ledger=${String(ledgerCommitHash ?? 'null')} head=${headCommitHash}`);
  }
  if (matrixCommitHash !== headCommitHash) {
    throw new Error(`Governance matrix commit hash mismatch: matrix=${String(matrixCommitHash ?? 'null')} head=${headCommitHash}`);
  }
  if (recoveryCommitHash !== headCommitHash) {
    throw new Error(
      `Recovery artifact provenance commit hash mismatch: recovery=${String(recoveryCommitHash ?? 'null')} head=${headCommitHash}`,
    );
  }
  if (parityCommitHash !== headCommitHash) {
    throw new Error(`Recovery parity provenance commit hash mismatch: parity=${String(parityCommitHash ?? 'null')} head=${headCommitHash}`);
  }
};

export const runCanonicalBundle = (): CanonicalBundleResult => {
  for (const args of INITIAL_CANONICAL_COMMANDS) runCommandWithRetry(args);
  for (const args of FINALIZATION_COMMANDS) runCommandWithRetry(args);

  const headCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const ledger = readJson(LEDGER_PATH);
  const matrix = readJson(MATRIX_PATH);
  const recovery = readJson(RECOVERY_PATH);
  const parity = readJson(PARITY_PATH);
  assertBundleProvenanceFresh(headCommitHash, ledger, matrix, recovery, parity);

  return {
    ok: true,
    boundaryStatement: BOUNDARY_STATEMENT,
    headCommitHash,
    ledgerPath: LEDGER_PATH,
    matrixPath: MATRIX_PATH,
    recoveryPath: RECOVERY_PATH,
    parityPath: PARITY_PATH,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(runCanonicalBundle()));
}
