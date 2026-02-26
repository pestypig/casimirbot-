import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('warp-g4-sensitivity', () => {
  it('is deterministic under fixed seed', () => {
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const script = path.resolve('scripts/warp-g4-sensitivity.ts');
    execFileSync(process.execPath, [tsxCli, script], { stdio: 'ignore' });
    const outPath = path.join('artifacts/research/full-solve', `g4-sensitivity-${new Date().toISOString().slice(0, 10)}.json`);
    const a = fs.readFileSync(outPath, 'utf8');
    execFileSync(process.execPath, [tsxCli, script], { stdio: 'ignore' });
    const b = fs.readFileSync(outPath, 'utf8');
    const pa = JSON.parse(a);
    const pb = JSON.parse(b);
    expect(pa.seed).toBe(424242);
    expect(pb.seed).toBe(424242);
    expect(pa.cases).toEqual(pb.cases);
  }, 120_000);
});
