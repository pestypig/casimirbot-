// Pure public-key parsing only. This does not authenticate a key's provenance.
import { createHash } from 'node:crypto';

export function parseEd25519PublicKey(input) {
  if (!Buffer.isBuffer(input) || input.length === 0 || input.length > 16384)
    throw new Error('public_key_size');
  // OpenSSH public key records in this protocol are one ASCII line.
  if ([...input].some(b => b > 126 || (b < 32 && b !== 10)))
    throw new Error('public_key_encoding');
  const text = input.toString('ascii');
  const match = /^(ssh-ed25519) ([A-Za-z0-9+/]+={0,2})(?: [\x20-\x7e]*)?\n?$/.exec(text);
  if (!match) throw new Error('public_key_record');
  const blob = Buffer.from(match[2], 'base64');
  if (blob.toString('base64') !== match[2]) throw new Error('public_key_base64');
  // SSH string("ssh-ed25519") followed by SSH string(32-byte public key).
  if (blob.length !== 51 || blob.readUInt32BE(0) !== 11 ||
      !blob.subarray(4, 15).equals(Buffer.from('ssh-ed25519', 'ascii')) ||
      blob.readUInt32BE(15) !== 32)
    throw new Error('public_key_wire_format');
  return Object.freeze({
    algorithm: 'ssh-ed25519',
    canonical: `ssh-ed25519 ${match[2]}`,
    fingerprint: `SHA256:${createHash('sha256').update(blob).digest('base64').replace(/=+$/, '')}`,
  });
}

export function requireExpectedFingerprint(publicBytes, expected) {
  if (typeof expected !== 'string' || !/^SHA256:[A-Za-z0-9+/]{43}$/.test(expected))
    throw new Error('expected_fingerprint_format');
  const parsed = parseEd25519PublicKey(publicBytes);
  if (parsed.fingerprint !== expected) throw new Error('host_key_mismatch');
  // Equality is necessary, not sufficient: the controller must separately
  // validate authenticated API provenance before using this public key.
  return parsed;
}
