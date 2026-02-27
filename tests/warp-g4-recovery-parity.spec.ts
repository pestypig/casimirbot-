import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runRecoveryParity } from '../scripts/warp-g4-recovery-parity';

describe('warp g4 recovery parity', () => {
  it('is deterministic for fixed input and emits stable mismatch reasons', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-parity-'));
    const recoveryPath = path.join(tmpDir, 'recovery.json');
    const outA = path.join(tmpDir, 'parity-a.json');
    const outB = path.join(tmpDir, 'parity-b.json');

    fs.writeFileSync(
      recoveryPath,
      `${JSON.stringify(
        {
          provenance: { commitHash: 'deadbeef' },
          topRankedApplicabilityPassCases: [
            {
              id: 'case_0001',
              params: {
                warpFieldType: 'natario',
                gammaGeo: 1,
                dutyCycle: 0.02,
                dutyShip: 0.02,
                dutyEffective_FR: 0.02,
                sectorCount: 80,
                concurrentSectors: 1,
                gammaVanDenBroeck: 0.8,
                sampler: 'gaussian',
                fieldType: 'em',
                qCavity: 1e5,
                qSpoilingFactor: 1,
                tau_s_ms: 5,
                gap_nm: 0.4,
                shipRadius_m: 2,
              },
              applicabilityStatus: 'PASS',
              marginRatioRaw: 1.2,
              marginRatioRawComputed: 0.7,
              boundComputed_Jm3: -10,
              boundUsed_Jm3: -100,
              boundFloorApplied: true,
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    const a = await runRecoveryParity({ topN: 1, recoveryPath, outPath: outA });
    const b = await runRecoveryParity({ topN: 1, recoveryPath, outPath: outB });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);

    const payloadA = JSON.parse(fs.readFileSync(outA, 'utf8'));
    const payloadB = JSON.parse(fs.readFileSync(outB, 'utf8'));
    payloadA.generatedAt = 'fixed';
    payloadB.generatedAt = 'fixed';

    expect(payloadA).toEqual(payloadB);
    expect(['match', 'mismatch']).toContain(payloadA.candidates[0].parityStatus);
    expect(typeof payloadA.candidates[0].mismatchReason).toBe('string');
    expect(payloadA.boundaryStatement).toBe(
      'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.',
    );
  });
});
