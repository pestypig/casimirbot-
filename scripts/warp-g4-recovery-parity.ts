import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { evaluateQiGuardrail, getGlobalPipelineState, updateParameters } from '../server/energy-pipeline.js';

const DATE_STAMP = '2026-02-27';
const DEFAULT_TOP_N = 5;
const RECOVERY_PATH = path.join('artifacts', 'research', 'full-solve', `g4-recovery-search-${DATE_STAMP}.json`);
const OUT_PATH = path.join('artifacts', 'research', 'full-solve', `g4-recovery-parity-${DATE_STAMP}.json`);
const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);
const str = (value: unknown): string => (typeof value === 'string' ? value : String(value ?? 'UNKNOWN'));
const numEq = (a: number | null, b: number | null, eps = 1e-12) => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= eps;
};

type SelectionPolicy = 'applicability_pass' | 'fallback_global_min_raw_computed';

type MismatchReason =
  | 'none'
  | 'applicability_status_mismatch'
  | 'margin_ratio_raw_mismatch'
  | 'margin_ratio_raw_computed_mismatch'
  | 'bound_computed_mismatch'
  | 'bound_used_mismatch'
  | 'bound_floor_applied_mismatch';

const classifyMismatch = (scan: any, parity: any): { parityStatus: 'match' | 'mismatch'; mismatchReason: MismatchReason } => {
  if (scan.applicabilityStatus !== parity.applicabilityStatus) {
    return { parityStatus: 'mismatch', mismatchReason: 'applicability_status_mismatch' };
  }
  if (!numEq(scan.marginRatioRaw, parity.marginRatioRaw)) {
    return { parityStatus: 'mismatch', mismatchReason: 'margin_ratio_raw_mismatch' };
  }
  if (!numEq(scan.marginRatioRawComputed, parity.marginRatioRawComputed)) {
    return { parityStatus: 'mismatch', mismatchReason: 'margin_ratio_raw_computed_mismatch' };
  }
  if (!numEq(scan.boundComputed_Jm3, parity.boundComputed_Jm3)) {
    return { parityStatus: 'mismatch', mismatchReason: 'bound_computed_mismatch' };
  }
  if (!numEq(scan.boundUsed_Jm3, parity.boundUsed_Jm3)) {
    return { parityStatus: 'mismatch', mismatchReason: 'bound_used_mismatch' };
  }
  if (scan.boundFloorApplied !== parity.boundFloorApplied) {
    return { parityStatus: 'mismatch', mismatchReason: 'bound_floor_applied_mismatch' };
  }
  return { parityStatus: 'match', mismatchReason: 'none' };
};

const dominantFailureMode = (rows: any[]): 'applicability_limited' | 'margin_limited' | 'policy_floor_dominated' | 'evidence_path_blocked' => {
  if (rows.length === 0) return 'evidence_path_blocked';
  const applicabilityLimited = rows.every((row) => row.parity.applicabilityStatus !== 'PASS');
  if (applicabilityLimited) return 'applicability_limited';

  const anyPolicyFloorDominated = rows.some(
    (row) => row.parity.applicabilityStatus === 'PASS' && row.parity.boundFloorApplied === true && (row.parity.marginRatioRawComputed ?? Infinity) < 1,
  );
  if (anyPolicyFloorDominated) return 'policy_floor_dominated';

  const anyMarginLimited = rows.some(
    (row) => row.parity.applicabilityStatus === 'PASS' && (row.parity.marginRatioRaw ?? Infinity) >= 1 && (row.parity.marginRatioRawComputed ?? Infinity) >= 1,
  );
  if (anyMarginLimited) return 'margin_limited';

  return 'evidence_path_blocked';
};

export async function runRecoveryParity(opts: { topN?: number; recoveryPath?: string; outPath?: string } = {}) {
  const topN = Math.max(1, Math.floor(Number(opts.topN ?? DEFAULT_TOP_N)));
  const recoveryPath = opts.recoveryPath ?? RECOVERY_PATH;
  const outPath = opts.outPath ?? OUT_PATH;
  const headCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

  const recovery = JSON.parse(fs.readFileSync(recoveryPath, 'utf8')) as any;
  const recoveryCommitHash = typeof recovery?.provenance?.commitHash === 'string' ? recovery.provenance.commitHash : null;
  const applicabilityPassCandidates = Array.isArray(recovery?.topRankedApplicabilityPassCases) && recovery.topRankedApplicabilityPassCases.length > 0
    ? recovery.topRankedApplicabilityPassCases
    : Array.isArray(recovery?.cases)
      ? recovery.cases.filter((entry: any) => str(entry?.applicabilityStatus).toUpperCase() === 'PASS').sort((a: any, b: any) => str(a?.id).localeCompare(str(b?.id)))
      : [];

  const fallbackCandidates = Array.isArray(recovery?.cases)
    ? [...recovery.cases].sort((a: any, b: any) => {
        const aRawComputed = finiteOrNull(a?.marginRatioRawComputed) ?? Number.POSITIVE_INFINITY;
        const bRawComputed = finiteOrNull(b?.marginRatioRawComputed) ?? Number.POSITIVE_INFINITY;
        if (aRawComputed !== bRawComputed) return aRawComputed - bRawComputed;
        return str(a?.id).localeCompare(str(b?.id));
      })
    : [];

  const selectionPolicy: SelectionPolicy = applicabilityPassCandidates.length > 0 ? 'applicability_pass' : 'fallback_global_min_raw_computed';
  const selected = (selectionPolicy === 'applicability_pass' ? applicabilityPassCandidates : fallbackCandidates).slice(0, topN);
  const baseline = structuredClone(getGlobalPipelineState());
  const rows: any[] = [];

  for (const entry of selected) {
    const params = entry?.params ?? {};
    const next = await updateParameters(structuredClone(baseline), {
      warpFieldType: params.warpFieldType,
      gammaGeo: params.gammaGeo,
      dutyCycle: params.dutyCycle,
      dutyShip: params.dutyShip,
      dutyEffective_FR: params.dutyEffective_FR,
      sectorCount: params.sectorCount,
      concurrentSectors: params.concurrentSectors,
      gammaVanDenBroeck: params.gammaVanDenBroeck,
      qCavity: params.qCavity,
      qSpoilingFactor: params.qSpoilingFactor,
      gap_nm: params.gap_nm,
      shipRadius_m: params.shipRadius_m,
      qi: {
        ...(baseline.qi ?? {}),
        sampler: params.sampler,
        fieldType: params.fieldType,
        tau_s_ms: params.tau_s_ms,
      },
    } as any);
    const guard = evaluateQiGuardrail(next, {
      sampler: params.sampler,
      tau_ms: Number(params.tau_s_ms),
    });

    const scan = {
      applicabilityStatus: str(entry?.applicabilityStatus).toUpperCase(),
      marginRatioRaw: finiteOrNull(entry?.marginRatioRaw),
      marginRatioRawComputed: finiteOrNull(entry?.marginRatioRawComputed),
      boundComputed_Jm3: finiteOrNull(entry?.boundComputed_Jm3),
      boundUsed_Jm3: finiteOrNull(entry?.boundUsed_Jm3),
      boundFloorApplied: Boolean(entry?.boundFloorApplied),
    };
    const parity = {
      applicabilityStatus: str(guard?.applicabilityStatus).toUpperCase(),
      marginRatioRaw: finiteOrNull(guard?.marginRatioRaw),
      marginRatioRawComputed: finiteOrNull(guard?.marginRatioRawComputed),
      lhs_Jm3: finiteOrNull(guard?.lhs_Jm3),
      boundComputed_Jm3: finiteOrNull(guard?.boundComputed_Jm3),
      boundUsed_Jm3: finiteOrNull(guard?.boundUsed_Jm3),
      boundPolicyFloor_Jm3: finiteOrNull(guard?.boundPolicyFloor_Jm3),
      boundDefaultFloor_Jm3: finiteOrNull(guard?.boundDefaultFloor_Jm3),
      boundEnvFloor_Jm3: finiteOrNull(guard?.boundEnvFloor_Jm3),
      boundFloorApplied: Boolean(guard?.boundFloorApplied),
      metricT00Geom: finiteOrNull(guard?.metricT00Geom),
      metricT00Si: finiteOrNull(guard?.metricT00Si),
      metricT00SiFromGeom: finiteOrNull(guard?.metricT00SiFromGeom),
      metricT00SiRelError: finiteOrNull(guard?.metricT00SiRelError),
    };

    const parityResolution = classifyMismatch(scan, parity);
    rows.push({
      id: str(entry?.id),
      params,
      scan,
      parity,
      parityStatus: parityResolution.parityStatus,
      mismatchReason: parityResolution.mismatchReason,
    });
  }

  const anyCanonicalPassCandidate = rows.some(
    (row) => row.parity.applicabilityStatus === 'PASS' && (row.parity.marginRatioRaw ?? Number.POSITIVE_INFINITY) < 1,
  );
  const anyComputedOnlyPassCandidate = rows.some(
    (row) => row.parity.applicabilityStatus === 'PASS' && (row.parity.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) < 1,
  );

  const payload = {
    runId: `g4-recovery-parity-${DATE_STAMP}`,
    generatedAt: new Date().toISOString(),
    boundaryStatement: BOUNDARY_STATEMENT,
    recoveryArtifactPath: recoveryPath,
    topN,
    candidateCountChecked: rows.length,
    selectionPolicy,
    anyCanonicalPassCandidate,
    anyComputedOnlyPassCandidate,
    dominantFailureMode: dominantFailureMode(rows),
    provenance: {
      commitHash: headCommitHash,
      recoveryProvenanceCommitHash: recoveryCommitHash,
      recoveryProvenanceFresh: recoveryCommitHash != null && recoveryCommitHash === headCommitHash,
    },
    candidates: rows,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  return {
    ok: true,
    outPath,
    candidateCountChecked: rows.length,
    selectionPolicy,
    anyCanonicalPassCandidate,
    anyComputedOnlyPassCandidate,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runRecoveryParity()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
