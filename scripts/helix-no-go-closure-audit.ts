import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

type CommandResult = {
  command: string;
  status: number | null;
  stdout: string;
  stderr: string;
};

type ValidateResult = {
  ok: boolean;
  failure_count: number;
  failures: string[];
};

function runCommand(command: string, args: string[]): CommandResult {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return {
    command: [command, ...args].join(' '),
    status: result.status,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

function snippet(value: string, max = 220): string {
  if (!value) return '(none)';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function formatCommandStatus(result: CommandResult): string {
  if (result.status === 0) return '✅';
  if (result.status === null) return '⚠️';
  return '❌';
}

type PathState =
  | { status: '**EXISTS**' }
  | { status: '**MISSING**' }
  | { status: `**CHECK_ERROR:${string}**` };

function catFileState(ref: string, path: string): PathState {
  const result = spawnSync('git', ['cat-file', '-e', `${ref}:${path}`], { encoding: 'utf8' });
  if (result.status === 0) {
    return { status: '**EXISTS**' };
  }

  const stderr = `${result.stderr ?? ''}`.trim();
  const reason = stderr || `exit_${result.status ?? 'signal'}`;
  if (/Not a valid object name|invalid object|ambiguous argument|unknown revision|bad revision/i.test(reason)) {
    const compact = reason.replace(/\s+/g, ' ').slice(0, 120);
    return { status: `**CHECK_ERROR:${compact}**` };
  }
  return { status: '**MISSING**' };
}

const pkgPath = 'reports/helix-decision-package.json';
const validatePath = 'reports/helix-decision-validate.json';
const outPath = 'reports/helix-no-go-closure-audit.md';

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  gates?: Array<{ source_path?: string }>;
  novelty?: {
    t02?: { source_path?: string };
    t035?: { source_path?: string };
  };
  artifacts?: Array<{ path?: string }>;
};
const committedValidate = JSON.parse(readFileSync(validatePath, 'utf8')) as ValidateResult;

const commandResults: CommandResult[] = [
  runCommand('git', ['fetch', '--all', '--prune']),
  runCommand('git', ['remote', 'show', 'origin']),
];

const tempValidatePath = join(tmpdir(), `helix-decision-validate-${Date.now()}.json`);
const validatorRun = runCommand('npx', ['tsx', 'scripts/helix-decision-validate.ts', '--package', pkgPath]);
if (!validatorRun.stdout) {
  throw new Error('Validator produced no stdout; cannot build drift comparison.');
}
writeFileSync(tempValidatePath, `${validatorRun.stdout.trim()}\n`);
commandResults.push(validatorRun);

const freshValidate = JSON.parse(readFileSync(tempValidatePath, 'utf8')) as ValidateResult;

const evidencePaths = Array.from(
  new Set([
    ...(pkg.gates ?? []).map((g) => g.source_path),
    pkg.novelty?.t02?.source_path,
    pkg.novelty?.t035?.source_path,
    ...(pkg.artifacts ?? []).map((a) => a.path),
  ].filter((p): p is string => Boolean(p))),
);

const refs = git(['for-each-ref', '--format=%(refname:short)']);
const refList = refs.split('\n').filter(Boolean);
const baselineRef = ['origin/HEAD', 'origin/main', 'main'].find((ref) => refList.includes(ref));

const evidenceRows = evidencePaths.map((p) => {
  const head = catFileState('HEAD', p).status;
  const baseline = baselineRef ? catFileState(baselineRef, p).status : 'N/A';
  const note = baselineRef
    ? baseline === '**EXISTS**' && head === '**EXISTS**'
      ? 'present in baseline and HEAD'
      : baseline.includes('CHECK_ERROR') || head.includes('CHECK_ERROR')
        ? 'reference check error; baseline or ref unavailable/invalid'
        : 'drift/missing relative to baseline or HEAD'
    : 'no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone';
  return `| \`${p}\` | ${baseline} | ${head} | ${note} |`;
});

const topFixes = freshValidate.failures.slice(0, 3).map((f, i) => `${i + 1}. \`${f}\``).join('\n');
const blockers = freshValidate.failures.map((f, i) => `${i + 1}. \`${f}\``).join('\n');
const baselineLabel = baselineRef ? `\`${baselineRef}\`` : 'N/A';

const driftPieces: string[] = [];
if (committedValidate.ok !== freshValidate.ok) {
  driftPieces.push(`ok: ${committedValidate.ok} -> ${freshValidate.ok}`);
}
if (committedValidate.failure_count !== freshValidate.failure_count) {
  driftPieces.push(`failure_count: ${committedValidate.failure_count} -> ${freshValidate.failure_count}`);
}
const committedTop3 = committedValidate.failures.slice(0, 3);
const freshTop3 = freshValidate.failures.slice(0, 3);
if (JSON.stringify(committedTop3) !== JSON.stringify(freshTop3)) {
  driftPieces.push('first_3_failures changed');
}
const driftStatus = driftPieces.length === 0 ? 'NO-DRIFT' : `DRIFT (${driftPieces.join('; ')})`;

const commandLog = commandResults
  .map((result) => {
    const icon = formatCommandStatus(result);
    return `- ${icon} \`${result.command}\` (status: ${result.status ?? 'signal'}, stdout: \`${snippet(result.stdout)}\`, stderr: \`${snippet(result.stderr)}\`)`;
  })
  .join('\n');

const report = `# Helix NO-GO Closure Audit\n\n## Verdict\n\n**NO-GO**\n\n## Method (git-only, replayable)\n\n- Package input: \`${pkgPath}\`.\n- Validation input: committed \`${validatePath}\` and fresh validator replay to temp output.\n- Fresh validation capture: \`${tempValidatePath}\` (generated during this audit run).\n- Artifact existence checks use \`git cat-file -e <ref>:<path>\` only (no filesystem checks).\n- Baseline ref for comparison: ${baselineLabel}.\n\n## Evidence table\n\n| Path | Baseline (${baselineLabel}) | HEAD (\`git cat-file -e HEAD:<path>\`) | Note |\n|---|---|---|---|\n${evidenceRows.join('\n')}\n\n## Drift findings\n\n- Drift status: **${driftStatus}**.\n- Committed validate snapshot: \`ok=${committedValidate.ok}\`, \`failure_count=${committedValidate.failure_count}\`, first3=${JSON.stringify(committedTop3)}.\n- Fresh validate snapshot: \`ok=${freshValidate.ok}\`, \`failure_count=${freshValidate.failure_count}\`, first3=${JSON.stringify(freshTop3)}.\n- Validation failures captured below are sourced from fresh replay output and are reproducible via: \`npx tsx scripts/helix-decision-validate.ts --package ${pkgPath}\`.\n\n## Blocker list (ordered)\n${blockers}\n\n## Top 3 concrete fixes (from first failing blockers)\n${topFixes}\n\n## Command log\n${commandLog}\n`;

writeFileSync(outPath, report);
console.log(`Wrote ${outPath}`);
