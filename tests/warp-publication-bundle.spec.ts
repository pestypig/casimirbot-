import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { buildPublicationBundle } from '../scripts/warp-publication-bundle';

describe('warp publication bundle', () => {
  it('produces deterministic checksum manifest for identical inputs', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-pub-bundle-'));
    const out1 = path.join(root, 'bundle1');
    const out2 = path.join(root, 'bundle2');
    const first = buildPublicationBundle(out1);
    const second = buildPublicationBundle(out2);
    const m1 = fs.readFileSync(first.checksumManifest, 'utf8');
    const m2 = fs.readFileSync(second.checksumManifest, 'utf8');
    expect(m1).toEqual(m2);
    const parsed = JSON.parse(m1);
    expect(Array.isArray(parsed.files)).toBe(true);
    expect(parsed.files.length).toBeGreaterThan(0);
  });
});
