import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DATE_STAMP = '2026-02-26';
const OUT_PATH = path.join('artifacts/research/full-solve', `g4-decision-ledger-${DATE_STAMP}.json`);
const CANONICAL_SCOREBOARD = path.join('artifacts/research/full-solve', 'campaign-gate-scoreboard-2026-02-24.json');
const CANONICAL_FIRST_FAIL = path.join('artifacts/research/full-solve', 'campaign-first-fail-map-2026-02-24.json');
const INFLUENCE_PATH = path.join('artifacts/research/full-solve', 'g4-influence-scan-2026-02-26.json');

export const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

type DecisionClass = 'evidence_path_blocked' | 'applicability_limited' | 'margin_limited' | 'candidate_pass_found';
type Wave = 'A' | 'B' | 'C' | 'D';

type GenerateG4DecisionLedgerOptions = {
  rootDir?: string;
  outPath?: string;
  scoreboardPath?: string;
  firstFailPath?: string;
  influencePath?: string;
  getCommitHash?: () => string;
};

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);
const stringOrNull = (s: unknown): string | null => (typeof s === 'string' && s.trim().length > 0 ? s.trim() : null);

const REQUIRED_WAVES: Wave[] = ['A', 'B', 'C', 'D'];

const getCanonicalMissingWaves = (waveRows: Record<string, any>): Wave[] =>
  REQUIRED_WAVES.filter((wave) => !waveRows[wave]);

const classifyCanonical = (waveRows: Record<string, any>): DecisionClass => {
  const missingWaves = getCanonicalMissingWaves(waveRows);
  if (missingWaves.length > 0) return 'evidence_path_blocked';
  const rows = REQUIRED_WAVES.map((w) => waveRows[w]).filter(Boolean);
  const applicabilityPass = rows.every((row) => String(row?.applicabilityStatus ?? 'UNKNOWN').toUpperCase() === 'PASS');
  if (!applicabilityPass) return 'applicability_limited';
  const minRaw = Math.min(
    ...rows.map((row) => {
      const raw = finiteOrNull(row?.marginRatioRaw);
      return raw ?? Number.POSITIVE_INFINITY;
    }),
  );
  return minRaw >= 1 ? 'margin_limited' : 'candidate_pass_found';
};

const deriveScan = (influence: any): {
  scanDecisionClass: DecisionClass;
  scanCandidatePassFound: boolean;
  scanAnyApplicabilityPass: boolean;
  scanMinMarginRatioRawAmongApplicabilityPass: number | null;
} => {
  const decision = influence?.decision ?? {};
  const scanCandidatePassFound = Boolean(decision.scanCandidatePassFound);
  const scanAnyApplicabilityPass = Boolean(decision.scanAnyApplicabilityPass);
  const minRaw = finiteOrNull(decision.scanMinMarginRatioRawAmongApplicabilityPass);
  const scanDecisionClass: DecisionClass =
    typeof decision.classification === 'string'
      ? decision.classification
      : !Array.isArray(influence?.rankedEffects) || influence.rankedEffects.length === 0
        ? 'evidence_path_blocked'
        : scanCandidatePassFound
          ? 'candidate_pass_found'
          : scanAnyApplicabilityPass
            ? (minRaw ?? Number.POSITIVE_INFINITY) >= 1
              ? 'margin_limited'
              : 'candidate_pass_found'
            : 'applicability_limited';
  return {
    scanDecisionClass,
    scanCandidatePassFound,
    scanAnyApplicabilityPass,
    scanMinMarginRatioRawAmongApplicabilityPass: minRaw,
  };
};

export const generateG4DecisionLedger = (options: GenerateG4DecisionLedgerOptions = {}) => {
  const rootDir = options.rootDir ?? '.';
  const outPath = options.outPath ?? path.join(rootDir, OUT_PATH);
  const scoreboardPath = options.scoreboardPath ?? path.join(rootDir, CANONICAL_SCOREBOARD);
  const firstFailPath = options.firstFailPath ?? path.join(rootDir, CANONICAL_FIRST_FAIL);
  const influencePath = options.influencePath ?? path.join(rootDir, INFLUENCE_PATH);
  const getCommitHash = options.getCommitHash ?? (() => execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim());

  const commitHash = getCommitHash();
  const canonicalScoreboard = readJson(scoreboardPath);
  const canonicalFirstFail = readJson(firstFailPath);
  const influence = fs.existsSync(influencePath) ? readJson(influencePath) : null;

  const waves: Record<string, any> = {};
  for (const wave of REQUIRED_WAVES) {
    const evidencePath = path.join(rootDir, 'artifacts/research/full-solve', wave, 'evidence-pack.json');
    const fallbackEvidencePath = path.join(rootDir, wave, 'evidence-pack.json');
    const resolvedEvidencePath = fs.existsSync(evidencePath) ? evidencePath : fallbackEvidencePath;
    if (!fs.existsSync(resolvedEvidencePath)) continue;
    const pack = readJson(resolvedEvidencePath);
    const d = pack?.g4Diagnostics ?? {};
    waves[wave] = {
      lhs_Jm3: finiteOrNull(d.lhs_Jm3),
      boundComputed_Jm3: finiteOrNull(d.boundComputed_Jm3),
      boundPolicyFloor_Jm3: finiteOrNull(d.boundPolicyFloor_Jm3),
      boundEnvFloor_Jm3: finiteOrNull(d.boundEnvFloor_Jm3),
      boundDefaultFloor_Jm3: finiteOrNull(d.boundDefaultFloor_Jm3),
      boundFloor_Jm3: finiteOrNull(d.boundFloor_Jm3),
      boundUsed_Jm3: finiteOrNull(d.boundUsed_Jm3),
      boundFloorApplied: typeof d.boundFloorApplied === 'boolean' ? d.boundFloorApplied : null,
      marginRatioRaw: finiteOrNull(d.marginRatioRaw),
      marginRatioRawComputed: finiteOrNull(d.marginRatioRawComputed),
      applicabilityStatus: stringOrNull(d.applicabilityStatus) ?? 'UNKNOWN',
      reasonCode: Array.isArray(d.reasonCode) ? d.reasonCode : [],
      rhoSource: stringOrNull(d.rhoSource),
    };
  }

  const canonicalMissingWaves = getCanonicalMissingWaves(waves);
  const canonicalDecisionClass = classifyCanonical(waves);
  const scan = deriveScan(influence);
  const finalDecisionClass = canonicalMissingWaves.length > 0 ? 'evidence_path_blocked' : canonicalDecisionClass;
  const classificationMismatch = scan.scanDecisionClass !== canonicalDecisionClass;
  const classificationMismatchReason = classificationMismatch
    ? `canonical_authoritative_override: canonical=${canonicalDecisionClass};scan=${scan.scanDecisionClass}`
    : null;

  const payload = {
    date: DATE_STAMP,
    commitHash,
    boundaryStatement: BOUNDARY_STATEMENT,
    canonical: {
      counts: canonicalScoreboard?.counts ?? canonicalScoreboard?.statusCounts ?? null,
      decision: canonicalScoreboard?.decision ?? null,
      firstFail: canonicalFirstFail?.globalFirstFail ?? null,
    },
    canonicalDecisionClass,
    scanDecisionClass: scan.scanDecisionClass,
    finalDecisionClass,
    canonicalMissingWaves,
    classificationMismatch,
    classificationMismatchReason,
    influenceScan: {
      scanCandidatePassFound: scan.scanCandidatePassFound,
      scanAnyApplicabilityPass: scan.scanAnyApplicabilityPass,
      scanMinMarginRatioRawAmongApplicabilityPass: scan.scanMinMarginRatioRawAmongApplicabilityPass,
      topLeversByAbsLhsDelta: Array.isArray(influence?.rankedEffects)
        ? influence.rankedEffects.slice(0, 5).map((entry: any) => ({
            id: stringOrNull(entry?.id),
            family: stringOrNull(entry?.family),
            absLhsDelta: finiteOrNull(entry?.absLhsDelta),
            applicabilityStatus: stringOrNull(entry?.applicabilityStatus) ?? 'UNKNOWN',
            marginRatioRaw: finiteOrNull(entry?.marginRatioRaw),
          }))
        : [],
    },
    waves,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  return { ok: true, out: outPath, canonicalDecisionClass, scanDecisionClass: scan.scanDecisionClass, finalDecisionClass };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(generateG4DecisionLedger()));
}
