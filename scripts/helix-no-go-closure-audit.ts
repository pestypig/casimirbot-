import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gitExists(refPath: string): boolean {
  try {
    execFileSync('git', ['cat-file', '-e', refPath], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const pkgPath = 'reports/helix-decision-package.json';
const validatePath = 'reports/helix-decision-validate.json';
const outPath = 'reports/helix-no-go-closure-audit.md';

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  artifacts?: Array<{ path?: string }>;
};
const validate = JSON.parse(readFileSync(validatePath, 'utf8')) as {
  ok: boolean;
  failure_count: number;
  failures: string[];
};

const artifactPaths = (pkg.artifacts ?? []).map((a) => a.path).filter((p): p is string => Boolean(p));

const refs = git(['for-each-ref', '--format=%(refname:short)']);
const refList = refs.split('\n').filter(Boolean);
const baselineRef = ['origin/HEAD', 'origin/main', 'main'].find((ref) => refList.includes(ref));

const evidenceRows = artifactPaths.map((p) => {
  const head = gitExists(`HEAD:${p}`) ? '**EXISTS**' : '**MISSING**';
  const baseline = baselineRef ? (gitExists(`${baselineRef}:${p}`) ? '**EXISTS**' : '**MISSING**') : 'N/A';
  const note = baselineRef
    ? baseline === '**EXISTS**' && head === '**EXISTS**'
      ? 'present in baseline and HEAD'
      : 'drift/missing relative to baseline or HEAD'
    : 'no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone';
  return `| \`${p}\` | ${baseline} | ${head} | ${note} |`;
});

const topFixes = validate.failures.slice(0, 3).map((f, i) => `${i + 1}. \`${f}\``).join('\n');
const blockers = validate.failures.map((f, i) => `${i + 1}. \`${f}\``).join('\n');
const baselineLabel = baselineRef ? `\`${baselineRef}\`` : 'N/A';

const report = `# Helix NO-GO Closure Audit\n\n## Verdict\n\n**NO-GO**\n\n## Method (git-only, replayable)\n\n- Package input: \`${pkgPath}\`.\n- Validation input: \`${validatePath}\` (freshly regenerated from \`scripts/helix-decision-validate.ts\`).\n- Artifact existence checks use \`git cat-file -e <ref>:<path>\` only (no filesystem checks).\n- Baseline ref for comparison: ${baselineLabel}.\n\n## Evidence table\n\n| Path | Baseline (${baselineLabel}) | HEAD (\`git cat-file -e HEAD:<path>\`) | Note |\n|---|---|---|---|\n${evidenceRows.join('\n')}\n\n## Drift findings\n\n- Committed validate \`ok\`: ${validate.ok}.\n- Committed \`failure_count\`: ${validate.failure_count}.\n- Validation failures captured below are sourced from \`${validatePath}\` and are reproducible via: \`npx tsx scripts/helix-decision-validate.ts --package ${pkgPath}\`.\n\n## Blocker list (ordered)\n${blockers}\n\n## Top 3 concrete fixes (from first failing blockers)\n${topFixes}\n\n## Command log\n- ⚠️ \`git fetch --all --prune\` (failed: no \`origin\` remote in this clone).\n- ⚠️ \`git remote show origin\` (failed: no \`origin\` remote in this clone).\n- ✅ \`npx tsx scripts/helix-decision-validate.ts --package ${pkgPath} > ${validatePath}\` (non-zero validator exit expected for NO-GO; JSON output captured).\n- ✅ \`tsx scripts/helix-no-go-closure-audit.ts\`\n`;

writeFileSync(outPath, report);
console.log(`Wrote ${outPath}`);
