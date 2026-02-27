import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

type Wave = 'A' | 'B' | 'C' | 'D';
type DualFailMode = 'policy_only' | 'computed_only' | 'both' | 'neither';

const DATE = '2026-02-27';
const ROOT = path.join('artifacts', 'research', 'full-solve');
const OUT_JSON = path.join(ROOT, `g4-governance-matrix-${DATE}.json`);
const OUT_MD = path.join('docs', 'audits', 'research', `warp-g4-governance-matrix-${DATE}.md`);
const WAVES: Wave[] = ['A', 'B', 'C', 'D'];
const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);

const dual = (policy: boolean, computed: boolean): DualFailMode =>
  policy && computed ? 'both' : policy ? 'policy_only' : computed ? 'computed_only' : 'neither';

const fmt = (n: number | null): string => (n == null ? 'n/a' : Number(n).toString());

type Row = {
  wave: Wave;
  lhs_Jm3: number | null;
  boundComputed_Jm3: number | null;
  boundUsed_Jm3: number | null;
  boundFloorApplied: boolean | null;
  marginRatioRaw: number | null;
  marginRatioRawComputed: number | null;
  applicabilityStatus: string;
  g4FloorDominated: boolean;
  g4PolicyExceeded: boolean;
  g4ComputedExceeded: boolean;
  g4DualFailMode: DualFailMode;
  canonicalAuthoritativeClass: 'policy-floor dominated' | 'computed-bound dominated' | 'both' | 'neither';
  computedOnlyCounterfactualClass: 'computed-bound dominated' | 'neither';
  mismatch: boolean;
  mismatchReason: string;
};

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function classifyAuthoritative(d: Row['g4DualFailMode']): Row['canonicalAuthoritativeClass'] {
  if (d === 'both') return 'both';
  if (d === 'policy_only') return 'policy-floor dominated';
  if (d === 'computed_only') return 'computed-bound dominated';
  return 'neither';
}

export function generateG4GovernanceMatrix() {
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const rows: Row[] = WAVES.map((wave) => {
    const evidence = readJson(path.join(ROOT, wave, 'evidence-pack.json'));
    const d = evidence?.g4Diagnostics ?? {};
    const lhs = finiteOrNull(d.lhs_Jm3);
    const boundComputed = finiteOrNull(d.boundComputed_Jm3);
    const boundUsed = finiteOrNull(d.boundUsed_Jm3);
    const boundFloorApplied = typeof d.boundFloorApplied === 'boolean' ? d.boundFloorApplied : null;
    const raw = finiteOrNull(d.marginRatioRaw);
    const rawComputed = finiteOrNull(d.marginRatioRawComputed);
    const g4FloorDominated = Boolean(boundFloorApplied === true && boundUsed != null && boundComputed != null && boundUsed !== boundComputed);
    const g4PolicyExceeded = Boolean((raw ?? Number.POSITIVE_INFINITY) >= 1);
    const g4ComputedExceeded = Boolean((rawComputed ?? Number.POSITIVE_INFINITY) >= 1);
    const g4DualFailMode = dual(g4PolicyExceeded, g4ComputedExceeded);
    const canonicalAuthoritativeClass = classifyAuthoritative(g4DualFailMode);
    const computedOnlyCounterfactualClass = g4ComputedExceeded ? 'computed-bound dominated' : 'neither';
    const mismatch = canonicalAuthoritativeClass !== computedOnlyCounterfactualClass;
    const mismatchReason = mismatch
      ? `canonical=${canonicalAuthoritativeClass};counterfactual=${computedOnlyCounterfactualClass};floorApplied=${boundFloorApplied ?? 'n/a'};boundUsed=${fmt(boundUsed)};boundComputed=${fmt(boundComputed)};marginRaw=${fmt(raw)};marginRawComputed=${fmt(rawComputed)}`
      : `canonical_matches_counterfactual;class=${canonicalAuthoritativeClass}`;

    return {
      wave,
      lhs_Jm3: lhs,
      boundComputed_Jm3: boundComputed,
      boundUsed_Jm3: boundUsed,
      boundFloorApplied,
      marginRatioRaw: raw,
      marginRatioRawComputed: rawComputed,
      applicabilityStatus: String(d.applicabilityStatus ?? 'UNKNOWN'),
      g4FloorDominated,
      g4PolicyExceeded,
      g4ComputedExceeded,
      g4DualFailMode,
      canonicalAuthoritativeClass,
      computedOnlyCounterfactualClass,
      mismatch,
      mismatchReason,
    };
  });

  const allCanonical = Array.from(new Set(rows.map((r) => r.canonicalAuthoritativeClass))).join(',');
  const allCounterfactual = Array.from(new Set(rows.map((r) => r.computedOnlyCounterfactualClass))).join(',');
  const anyMismatch = rows.some((r) => r.mismatch);

  const payload = {
    date: DATE,
    commitHash,
    boundaryStatement: BOUNDARY_STATEMENT,
    canonicalAuthoritativeClass: allCanonical,
    computedOnlyCounterfactualClass: allCounterfactual,
    mismatch: anyMismatch,
    mismatchReason: anyMismatch
      ? 'canonical_authoritative_uses_policy_bound;counterfactual_uses_computed_bound_only'
      : 'none',
    rows,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);

  const table = rows
    .map(
      (r) =>
        `| ${r.wave} | ${fmt(r.lhs_Jm3)} | ${fmt(r.boundComputed_Jm3)} | ${fmt(r.boundUsed_Jm3)} | ${r.boundFloorApplied ?? 'n/a'} | ${fmt(r.marginRatioRaw)} | ${fmt(r.marginRatioRawComputed)} | ${r.applicabilityStatus} | ${r.canonicalAuthoritativeClass} | ${r.computedOnlyCounterfactualClass} | ${r.mismatch} | ${r.mismatchReason} |`,
    )
    .join('\n');

  const md = `# G4 Governance Matrix (${DATE})\n\n## Boundary statement\n${BOUNDARY_STATEMENT}\n\n## Summary\n- canonical authoritative class: ${payload.canonicalAuthoritativeClass}\n- computed-only counterfactual class: ${payload.computedOnlyCounterfactualClass}\n- mismatch: ${payload.mismatch}\n- mismatch reason: ${payload.mismatchReason}\n\n## Per-wave matrix\n| Wave | lhs_Jm3 | boundComputed_Jm3 | boundUsed_Jm3 | floorApplied | marginRaw | marginRawComputed | applicability | canonical authoritative class | computed-only counterfactual class (non-authoritative) | mismatch | mismatch explanation |\n| --- | ---: | ---: | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- |\n${table}\n`;

  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, md);

  const result = { ok: true, json: OUT_JSON, markdown: OUT_MD, payload };
  console.log(JSON.stringify({ ok: true, json: OUT_JSON, markdown: OUT_MD }));
  return result;
}


if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateG4GovernanceMatrix();
}

