import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEd25519PublicKey, requireExpectedFingerprint } from './h2_p8p_hostkey_public.mjs';

const wire = Buffer.concat([Buffer.from([0,0,0,11]), Buffer.from('ssh-ed25519'),
  Buffer.from([0,0,0,32]), Buffer.alloc(32, 7)]);
const record = Buffer.from(`ssh-ed25519 ${wire.toString('base64')} fixture\n`);
const expected = `SHA256:${createHash('sha256').update(wire).digest('base64url').replace(/-/g,'+').replace(/_/g,'/')}`;
test('parses exact public-key wire and fingerprint, strips comment', () => {
  const result = requireExpectedFingerprint(record, expected);
  assert.equal(result.canonical, `ssh-ed25519 ${wire.toString('base64')}`);
  assert.equal(result.fingerprint, expected);
  assert.ok(Object.isFrozen(result));
  assert.equal(Object.hasOwn(result, 'authenticated'), false);
});
test('rejects wrong expected fingerprint', () => {
  assert.throws(() => requireExpectedFingerprint(record, `SHA256:${'A'.repeat(43)}`), /host_key_mismatch/);
});
test('rejects malformed expected fingerprints', () => {
  for (const value of [null, '', expected+'=', expected+'\n', '*'])
    assert.throws(() => requireExpectedFingerprint(record, value));
});
test('rejects private key, multiple records and non-ASCII/control input', () => {
  for (const value of ['-----BEGIN OPENSSH PRIVATE KEY-----', record+String(record), record+'\n',
    String(record).replace('fixture','fi\u0000xture'), String(record).replace('fixture','é')])
    assert.throws(() => parseEd25519PublicKey(Buffer.from(value)));
});
test('rejects wrong algorithm, trailing wire bytes and malformed length fields', () => {
  const variants = [Buffer.concat([wire, Buffer.from([0])]), Buffer.from(wire), Buffer.from(wire)];
  variants[1].writeUInt32BE(31,15); variants[2][4]=120;
  for (const blob of variants)
    assert.throws(() => parseEd25519PublicKey(Buffer.from(`ssh-ed25519 ${blob.toString('base64')}`)));
  assert.throws(() => parseEd25519PublicKey(Buffer.from(`ssh-rsa ${wire.toString('base64')}`)));
});
test('rejects noncanonical base64 and invalid input size/type', () => {
  for (const value of [Buffer.alloc(0), Buffer.alloc(16385,65), 'not a buffer',
    Buffer.from(`ssh-ed25519 ${wire.toString('base64')}=`)])
    assert.throws(() => parseEd25519PublicKey(value));
});
test('rejects high-bit aliases in every wire algorithm byte', () => {
  for(let i=4;i<15;i++) {
    const malformed=Buffer.from(wire); malformed[i]|=0x80;
    assert.throws(() => parseEd25519PublicKey(Buffer.from(`ssh-ed25519 ${malformed.toString('base64')}`)), /wire_format/);
  }
});
test('fingerprint agrees with installed OpenSSH on synthetic public fixture', () => {
  const folder = mkdtempSync(join(tmpdir(), 'nhm2-public-key-fixture-'));
  const file = join(folder, 'synthetic.pub');
  writeFileSync(file, record, {flag:'wx'});
  const executable = process.platform === 'win32'
    ? 'C:/Windows/System32/OpenSSH/ssh-keygen.exe' : 'ssh-keygen';
  const output = execFileSync(executable, ['-l','-E','sha256','-f',file],
    {encoding:'utf8',timeout:5000,windowsHide:true,maxBuffer:16384});
  assert.equal(output.trim().split(/\s+/)[1], parseEd25519PublicKey(record).fingerprint);
  // Retain the tiny synthetic fixture; no production evidence is removed.
});
