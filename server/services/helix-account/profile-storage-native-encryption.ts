import crypto from 'node:crypto';
import {
  encryptProviderCredentialForStorage,
  decryptStoredProviderCredentialForStorage,
  type ProviderCredentialEnvelope,
} from '../brokerage/provider-credential-vault';

export const NATIVE_PROFILE_SNAPSHOT_PREFIX = 'native-profile-v1:';
const algorithm = 'aes-256-gcm' as const;
const aadFor = (profileId: string) => JSON.stringify(['helix.profile-storage.v1', profileId]);

export function nativeProfileEncryptionConfigured(): boolean {
  // Partial broker configuration must fail closed in the existing vault client.
  return Boolean(process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN?.trim() ||
    process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN?.trim());
}

export async function encryptNativeProfileSnapshot(profileId: string, value: unknown) {
  const key = crypto.randomBytes(32);
  const aad = aadFor(profileId);
  try {
    // Only the per-snapshot key crosses the bounded native broker. Large chat
    // snapshots stay within the existing profile quota, not its credential limit.
    const wrapped = await encryptProviderCredentialForStorage(key.toString('base64url'), aad);
    if (!wrapped.keyId.startsWith('native:')) throw new Error('profile_native_broker_required');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAAD(Buffer.from(aad));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return {
      encrypted_snapshot: NATIVE_PROFILE_SNAPSHOT_PREFIX + JSON.stringify({
        wrapped, iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'),
        ciphertext: ciphertext.toString('base64url'),
      }),
      encryption_key_id: wrapped.keyId,
      encryption_algorithm: algorithm,
    };
  } finally { key.fill(0); }
}

export async function decryptNativeProfileSnapshot<T>(profileId: string, envelope: string): Promise<T> {
  if (!nativeProfileEncryptionConfigured() || !envelope.startsWith(NATIVE_PROFILE_SNAPSHOT_PREFIX)) {
    throw new Error('profile_native_broker_required');
  }
  const parsed = JSON.parse(envelope.slice(NATIVE_PROFILE_SNAPSHOT_PREFIX.length)) as {
    wrapped: ProviderCredentialEnvelope; iv: string; tag: string; ciphertext: string;
  };
  const wrapped = parsed?.wrapped;
  if (wrapped?.algorithm !== algorithm || !wrapped.keyId?.startsWith('native:') ||
      !wrapped.encryptedValue?.startsWith('v2:') ||
      typeof parsed.iv !== 'string' || typeof parsed.tag !== 'string' || typeof parsed.ciphertext !== 'string') {
    throw new Error('profile_native_envelope_invalid');
  }
  const aad = aadFor(profileId);
  const encoded = await decryptStoredProviderCredentialForStorage<unknown>(
    wrapped.encryptedValue, aad, wrapped.keyId,
  );
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9_-]{43}$/u.test(encoded)) {
    throw new Error('profile_native_envelope_invalid');
  }
  const key = Buffer.from(encoded, 'base64url');
  try {
    const iv = Buffer.from(parsed.iv, 'base64url');
    const tag = Buffer.from(parsed.tag, 'base64url');
    if (key.length !== 32 || iv.length !== 12 || tag.length !== 16) throw new Error('profile_native_envelope_invalid');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(parsed.ciphertext, 'base64url')), decipher.final(),
    ]).toString('utf8')) as T;
  } finally { key.fill(0); }
}
