import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const CANONICAL_COMMANDS = [
  ['run', 'warp:full-solve:canonical'],
  ['run', 'warp:full-solve:g4-sensitivity'],
  ['run', 'warp:full-solve:g4-governance-matrix'],
  ['run', 'warp:full-solve:g4-decision-ledger'],
] as const;

const LEDGER_PATH = path.join('artifacts', 'research', 'full-solve', 'g4-decision-ledger-2026-02-26.json');
const MATRIX_PATH = path.join('artifacts', 'research', 'full-solve', 'g4-governance-matrix-2026-02-27.json');

type CanonicalBundleResult = {
  ok: boolean;
  boundaryStatement: string;
  headCommitHash: string;
  ledgerPath: string;
  matrixPath: string;
};

const npmCli = process.env.npm_execpath;

const readJson = (filePath: string): any => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const runCommand = (args: readonly string[]) => {
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const commandArgs = npmCli ? [npmCli, ...args] : [...args];
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    const spawnError = result.error ? `;error=${result.error.message}` : '';
    throw new Error(`Command failed: npm ${args.join(' ')} (exit=${result.status ?? 'null'}${spawnError})`);
  }
};

export const runCanonicalBundle = (): CanonicalBundleResult => {
  for (const args of CANONICAL_COMMANDS) {
    runCommand(args);
  }

  const headCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const ledger = readJson(LEDGER_PATH);
  const matrix = readJson(MATRIX_PATH);

  if (ledger?.commitHash !== headCommitHash) {
    throw new Error(
      `Ledger commit hash mismatch: ledger=${String(ledger?.commitHash ?? 'null')} head=${headCommitHash}`,
    );
  }
  if (matrix?.commitHash !== headCommitHash) {
    throw new Error(
      `Governance matrix commit hash mismatch: matrix=${String(matrix?.commitHash ?? 'null')} head=${headCommitHash}`,
    );
  }

  return {
    ok: true,
    boundaryStatement: BOUNDARY_STATEMENT,
    headCommitHash,
    ledgerPath: LEDGER_PATH,
    matrixPath: MATRIX_PATH,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(runCanonicalBundle()));
}
