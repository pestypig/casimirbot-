// Library only. Importing this module performs no cloud or filesystem action.
import { performance } from 'node:perf_hooks';
import { join, resolve } from 'node:path';
import { boundedProcess } from './h2_p8p_r42_bounded_process.mjs';
import { validateRetainedInstances } from './h2_p8p_r43_resource_guard.mjs';
import { inspect, localStore } from './h2_p8p_r42_local_io.mjs';

export const resource = Object.freeze({
  project: 'dark-stratum-455714-h4', zone: 'us-east1-b',
  original: 'nhm2-h2-p8p-r32-e2-4-20260904', originalId: '1893159507643031574',
  helper: 'nhm2-h2-p8p-r39-rescue-e2-small-20260904', helperId: '7129462452423922626',
  clone: 'nhm2-h2-p8p-r39-evidence-clone-20260904',
});
const sdk = 'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
const python = `${sdk}/platform/bundledpython/python.exe`;
const gcloud = `${sdk}/lib/gcloud.py`;
const project = `--project=${resource.project}`;
const zone = `--zone=${resource.zone}`;
const repo = resolve(import.meta.dirname, '../../..');
export const productionPaths = Object.freeze({
  shortRoot: 'C:/NHM2-R43',
  evidenceRoot: join(repo, 'artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r43-retrieval-v1-20260905'),
  volumeRoot: 'C:/',
  receipt: join(repo, 'artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r40-stopped-disk-fixture-evidence-v1-20260904/rescue.stdout.txt'),
});

// Injectable subprocess and filesystem boundaries are used only by local tests.
export function makeAdapter({ run = boundedProcess, paths = productionPaths, store = localStore(paths.shortRoot, paths.evidenceRoot, paths.volumeRoot) } = {}) {
  let sequence = 0;
  async function call(args, timeoutMs) {
    const name = `${String(++sequence).padStart(2, '0')}-command.json`;
    let result;
    try {
      result = await run(python, ['-S', gcloud, ...args], {
        timeoutMs, maxBytes: 1048576,
        env: { ...process.env, CLOUDSDK_CONFIG: 'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config', CLOUDSDK_CORE_DISABLE_USAGE_REPORTING: 'true', CLOUDSDK_CORE_DISABLE_PROMPTS: '1', CLOUDSDK_SSH_PUTTY_FORCE_CONNECT: 'false' },
      });
    } catch (error) {
      try { store.receipt(name, { args, error: error.message, stdout: error.stdout, stderr: error.stderr }); } catch { /* Flow still must reach cleanup. */ }
      throw error;
    }
    store.receipt(name, { args, ...result });
    return result.stdout.trim();
  }
  return {
    now: () => performance.now(),
    freeBytes: () => store.freeBytes(),
    prepareExclusive: () => store.prepare(),
    async authenticate({ timeoutMs }) {
      const receipt = inspect(paths.receipt);
      if (receipt.bytes !== 107 || receipt.sha256 !== '6c61247fe3422324d832d9006ae2e084c3340286cc7435054045b4d99f4d4c18') throw new Error('r40_receipt_mismatch');
      const account = await call(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], timeoutMs);
      const configuredProject = await call(['config', 'get-value', 'core/project'], timeoutMs);
      if (account !== 'pestypig@gmail.com' || configuredProject !== resource.project) throw new Error('account_project_mismatch');
      const original = JSON.parse(await call(['compute', 'instances', 'describe', resource.original, project, zone, '--format=json'], timeoutMs));
      const helper = JSON.parse(await call(['compute', 'instances', 'describe', resource.helper, project, zone, '--format=json'], timeoutMs));
      validateRetainedInstances(original, helper);
    },
    start: ({ timeoutMs }) => call(['compute', 'instances', 'start', resource.helper, project, zone, '--quiet'], timeoutMs),
    wait: ms => new Promise(resolveWait => setTimeout(resolveWait, ms)),
    downloadExclusive: ({ timeoutMs }) => call(['compute', 'scp', `pestypig@${resource.helper}:/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz`, store.download, project, zone, '--quiet'], timeoutMs),
    inspectArchive: () => store.inspectArchive(),
    publishExclusive: () => store.publish(),
    inspectPublished: () => store.inspectPublished(),
    stop: ({ timeoutMs }) => call(['compute', 'instances', 'stop', resource.helper, project, zone, '--quiet'], timeoutMs),
    async status({ timeoutMs }) {
      const helper = JSON.parse(await call(['compute', 'instances', 'describe', resource.helper, project, zone, '--format=json'], timeoutMs));
      if (String(helper.id) !== resource.helperId) throw new Error('cleanup_identity_mismatch');
      return helper.status;
    },
    saveResult: result => store.receipt('result.json', result),
  };
}
