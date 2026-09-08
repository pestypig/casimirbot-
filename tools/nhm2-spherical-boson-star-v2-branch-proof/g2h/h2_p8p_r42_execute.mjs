import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

if (process.argv.length !== 3 || process.argv[2] !== '--execute-once') {
  throw new Error('requires_explicit_execute_once_argument_and_separate_user_authorization');
}
const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, 'h2_p8p_r42_manifest.json'), 'utf8'));
for (const [name, expected] of Object.entries(manifest.files)) {
  if (!/^h2_p8p_r42_[a-z_]+\.mjs$/.test(name)) throw new Error('invalid_manifest_path');
  const data = readFileSync(resolve(import.meta.dirname, name));
  if (data.length !== expected.bytes || createHash('sha256').update(data).digest('hex') !== expected.sha256) {
    throw new Error(`input_hash_mismatch:${name}`);
  }
}
const { makeAdapter } = await import('./h2_p8p_r42_cloud_adapter.mjs');
const { retrieve } = await import('./h2_p8p_r42_retrieval_flow.mjs');
const io = makeAdapter();
const result = await retrieve(io);
// Emit even if local disk loss prevents durable receipt publication.
console.log(JSON.stringify(result, null, 2));
try { io.saveResult(result); } catch (error) {
  console.error(`result_persistence_failed:${error.message}`);
  process.exitCode = 1;
}
if (!result.pass) process.exitCode = 1;
