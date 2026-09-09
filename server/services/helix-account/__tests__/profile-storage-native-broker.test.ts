import { afterEach, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { startDesktopProviderCredentialBroker } from '../../../../apps/desktop/src/provider-credential-broker';
import { resetAccountSessionStore } from '../account-session-store';
import { readProfileStorageSnapshot, writeProfileStorageSnapshot } from '../profile-storage-store';
import { decryptNativeProfileSnapshot, encryptNativeProfileSnapshot } from '../profile-storage-native-encryption';
import { getPool } from '../../../db/client';

afterEach(() => vi.unstubAllEnvs());

it('backs up an exact empty chat through the native broker without a profile master key', async () => {
  vi.stubEnv('HELIX_LOCAL_PG_MEM_PERSIST', '0');
  vi.stubEnv('NODE_ENV', 'test');
  await resetAccountSessionStore();
  const broker = await startDesktopProviderCredentialBroker({
    keyring: { activeKey: randomBytes(32).toString('base64url'), retiredKeys: [] },
  });
  try {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('HELIX_PROFILE_STORAGE_ENCRYPTION_KEY', '');
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY', '');
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN', broker.origin);
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN', broker.token);
    const value = JSON.stringify({ state: {
      activeId: 'chat:retained', sessions: { 'chat:retained': {
        id: 'chat:retained', title: 'Retained session', messages: [],
      } },
    } });
    const written = await writeProfileStorageSnapshot({
      profile_id: 'local:admin', quota_bytes: 1024 * 1024,
      snapshot: {
        artifacts: [{ schema: 'helix.workspace_memory_registry.v1',
          artifact_id: 'chat:retained', artifact_type: 'helix_chat_session',
          owner_scope: 'profile', storage_backend: 'localStorage',
          storage_key: 'agi-chat-sessions-v1', sync_status: 'profile_synced',
          profile_id: 'local:admin', title: 'Retained session',
          updated_at: new Date().toISOString() }],
        entries: [{ storage_key: 'agi-chat-sessions-v1', storage_backend: 'localStorage',
          value, size_bytes: value.length, updated_at: new Date().toISOString(),
          artifact_ids: ['chat:retained'] }],
      },
    });
    expect(written).toMatchObject({ ok: true });
    const { rows } = await getPool().query('SELECT snapshot, encrypted_snapshot FROM helix_account_profile_storage WHERE profile_id=$1', ['local:admin']);
    const metadata = typeof rows[0].snapshot === 'string' ? JSON.parse(rows[0].snapshot) : rows[0].snapshot;
    expect(metadata.entries[0].value).toBe('');
    expect(rows[0].encrypted_snapshot).toMatch(/^native-profile-v1:/u);
    expect(rows[0].encrypted_snapshot).not.toContain(value);
    expect((await readProfileStorageSnapshot('local:admin')).entries[0]?.value).toBe(value);
  } finally { await broker.close(); }
}, 20000);

it('retains large snapshots across broker restart and rejects foreign profiles, tampering and unavailable protection', async () => {
  const keyring = { activeKey: randomBytes(32).toString('base64url'), retiredKeys: [] };
  let broker = await startDesktopProviderCredentialBroker({ keyring });
  const configure = () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('HELIX_PROFILE_STORAGE_ENCRYPTION_KEY', '');
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY', '');
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN', broker.origin);
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN', broker.token);
  };
  try {
    configure();
    const value = { content: 'non-secret fixture '.repeat(30000) };
    const stored = await encryptNativeProfileSnapshot('profile:a', value);
    expect(stored.encrypted_snapshot).not.toContain('non-secret fixture');
    await broker.close();
    broker = await startDesktopProviderCredentialBroker({ keyring: {
      activeKey: randomBytes(32).toString('base64url'), retiredKeys: [keyring.activeKey],
    } });
    configure();
    expect(await decryptNativeProfileSnapshot('profile:a', stored.encrypted_snapshot)).toEqual(value);
    await expect(decryptNativeProfileSnapshot('profile:b', stored.encrypted_snapshot)).rejects.toThrow();
    const [prefix, ...rest] = stored.encrypted_snapshot.split(':');
    const parsed = JSON.parse(rest.join(':'));
    parsed.ciphertext = (parsed.ciphertext[0] === 'A' ? 'B' : 'A') + parsed.ciphertext.slice(1);
    await expect(decryptNativeProfileSnapshot('profile:a', prefix + ':' + JSON.stringify(parsed))).rejects.toThrow();
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN', 'invalid');
    await expect(encryptNativeProfileSnapshot('profile:a', value)).rejects.toThrow();
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN', '');
    vi.stubEnv('HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN', '');
    await expect(decryptNativeProfileSnapshot('profile:a', stored.encrypted_snapshot)).rejects.toThrow('profile_native_broker_required');
  } finally { await broker.close(); }
}, 20000);
