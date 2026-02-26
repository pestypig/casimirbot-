import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DATE_STAMP = '2026-02-26';
const ROOT = path.join('artifacts', 'research', 'full-solve');
const OUT_PATH = path.join(ROOT, `g4-decision-ledger-${DATE_STAMP}.json`);
const CANONICAL_SCOREBOARD = path.join(ROOT, 'campaign-gate-scoreboard-2026-02-24.json');
const CANONICAL_FIRST_FAIL = path.join(ROOT, 'campaign-first-fail-map-2026-02-24.json');
const INFLUENCE_PATH = path.join(ROOT, 'g4-influence-scan-2026-02-26.json');

export const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

export type DecisionClass = 'evidence_path_blocked' | 'applicability_limited' | 'margin_limited' | 'candidate_pass_found';

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);
const stringOrNull = (s: unknown): string | null => (typeof s === 'string' && s.trim().length > 0 ? s.trim() : null);

export const REQUIRED_CANONICAL_WAVES = ['A', 'B', 'C', 'D'] as const;

export const classifyCanonical = (waveRows: Record<string, any>): { decisionClass: DecisionClass; missingWaves: string[] } => {
  const missingWaves = REQUIRED_CANONICAL_WAVES.filter((wave) => !waveRows[wave]);
  if (missingWaves.length > 0) {
    return { decisionClass: 'evidence_path_blocked', missingWaves: missingWaves.slice() };
  }
  const rows = REQUIRED_CANONICAL_WAVES.map((w) => waveRows[w]);
  const applicabilityPass = rows.every((row) => String(row?.applicabilityStatus ?? 'UNKNOWN').toUpperCase() === 'PASS');
  if (!applicabilityPass) return { decisionClass: 'applicability_limited', missingWaves: [] };
  const minRaw = Math.min(
    ...rows.map((row) => {
      const raw = finiteOrNull(row?.marginRatioRaw);
      return raw ?? Number.POSITIVE_INFINITY;
    }),
  );
  return { decisionClass: minRaw >= 1 ? 'margin_limited' : 'candidate_pass_found', missingWaves: [] };
};

export const deriveScan = (influence: any): {
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

type GenerateOptions = {
  rootDir?: string;
  outPath?: string;
  scoreboardPath?: string;
  firstFailPath?: string;
  influencePath?: string;
  getCommitHash?: () => string;
};

export const generateG4DecisionLedger = (options: GenerateOptions = {}) => {
  const rootDir = options.rootDir ?? ROOT;
  const outPath = options.outPath ?? OUT_PATH;
  const scoreboardPath = options.scoreboardPath ?? CANONICAL_SCOREBOARD;
  const firstFailPath = options.firstFailPath ?? CANONICAL_FIRST_FAIL;
  const influencePath = options.influencePath ?? INFLUENCE_PATH;
  const commitHash = options.getCommitHash?.() ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

  const canonicalScoreboard = readJson(scoreboardPath);
  const canonicalFirstFail = readJson(firstFailPath);
  const influence = fs.existsSync(influencePath) ? readJson(influencePath) : null;

  const waves: Record<string, any> = {};
  for (const wave of REQUIRED_CANONICAL_WAVES) {
    const evidencePath = path.join(rootDir, wave, 'evidence-pack.json');
    if (!fs.existsSync(evidencePath)) continue;
    const pack = readJson(evidencePath);
    const d = pack?.g4Diagnostics ?? {};
    waves[wave] = {
      lhs_Jm3: finiteOrNull(d.lhs_Jm3),
      boundComputed_Jm3: finiteOrNull(d.boundComputed_Jm3),
      boundPolicyFloor_Jm3: finiteOrNull(d.boundPolicyFloor_Jm3),
      boundEnvFloor_Jm3: finiteOrNull(d.boundEnvFloor_Jm3),
      boundDefaultFloor_Jm3: finiteOrNull(d.boundDefaultFloor_Jm3),
      boundFallbackAbs_Jm3: finiteOrNull(d.boundFallbackAbs_Jm3),
      boundFloor_Jm3: finiteOrNull(d.boundFloor_Jm3),
      boundUsed_Jm3: finiteOrNull(d.boundUsed_Jm3),
      boundFloorApplied: typeof d.boundFloorApplied === 'boolean' ? d.boundFloorApplied : null,
      marginRatioRaw: finiteOrNull(d.marginRatioRaw),
      applicabilityStatus: stringOrNull(d.applicabilityStatus) ?? 'UNKNOWN',
      reasonCode: Array.isArray(d.reasonCode) ? d.reasonCode : [],
      rhoSource: stringOrNull(d.rhoSource),
    };
  }

  const canonical = classifyCanonical(waves);
  const canonicalDecisionClass = canonical.decisionClass;
  const scan = deriveScan(influence);
  const finalDecisionClass = canonicalDecisionClass;
  const classificationMismatch = scan.scanDecisionClass !== canonicalDecisionClass;
  const mismatchParts = [
    `canonical_authoritative_override: canonical=${canonicalDecisionClass};scan=${scan.scanDecisionClass}`,
  ];
  if (canonical.missingWaves.length > 0) mismatchParts.push(`missingCanonicalWaves=${canonical.missingWaves.join(',')}`);
  const classificationMismatchReason = classificationMismatch ? mismatchParts.join(';') : null;

  const payload = {
    date: DATE_STAMP,
    commitHash,
    boundaryStatement: BOUNDARY_STATEMENT,
    canonicalContext: 'authoritative',
    scanContext: 'exploratory_noncanonical',
    canonical: {
      counts: canonicalScoreboard?.counts ?? canonicalScoreboard?.statusCounts ?? null,
      decision: canonicalScoreboard?.decision ?? null,
      firstFail: canonicalFirstFail?.globalFirstFail ?? null,
    },
    canonicalMissingWaves: canonical.missingWaves,
    canonicalDecisionClass,
    scanDecisionClass: scan.scanDecisionClass,
    finalDecisionClass,
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
