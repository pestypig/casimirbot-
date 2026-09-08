// Inert orchestration core. No cloud implementation or execution entry point.
export const expectedArchive = Object.freeze({
  bytes: 12122,
  sha256: '73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922',
});
const reserveBytes = 256 * 1024 * 1024;

// Adapter operations must honor timeoutMs, terminate their subprocess trees on
// expiry, and reject. A Promise race alone does not satisfy this contract.
export async function retrieve(io) {
  let startAttempted = false;
  let deadline;
  let failure = null;
  let cleanupFailure = null;
  let stopped = false;
  let archiveVerified = false;
  const events = [];
  const note = (kind, detail = '') => events.push({ at: io.now(), kind, detail });
  const remaining = (cleanup = false) => {
    const ms = deadline - io.now() - (cleanup ? 0 : 300000);
    if (ms <= 0) throw new Error('deadline_exhausted');
    return Math.min(ms, cleanup ? 180000 : 120000);
  };
  const capacity = async () => {
    if (await io.freeBytes() < reserveBytes) throw new Error('insufficient_disk_space');
  };
  try {
    await capacity();
    await io.prepareExclusive();
    await io.authenticate({ timeoutMs: 120000 });
    await capacity();
    deadline = io.now() + 1200000;
    // Set before dispatch: a timeout cannot establish that start did not happen.
    startAttempted = true;
    note('start_attempt');
    await io.start({ timeoutMs: remaining() });
    await io.wait(120000);
    await capacity();
    note('transfer_attempt');
    await io.downloadExclusive({ timeoutMs: remaining() });
    const input = await io.inspectArchive();
    if (input.bytes !== expectedArchive.bytes) throw new Error('archive_size_mismatch');
    if (input.sha256 !== expectedArchive.sha256) throw new Error('archive_hash_mismatch');
    await io.publishExclusive();
    const published = await io.inspectPublished();
    if (published.bytes !== expectedArchive.bytes || published.sha256 !== expectedArchive.sha256) {
      throw new Error('published_archive_mismatch');
    }
    archiveVerified = true;
    note('archive_verified');
  } catch (error) {
    failure = String(error.message ?? error);
    note('failure', failure);
  } finally {
    if (startAttempted) {
      note('cleanup_entered');
      try {
        await io.stop({ timeoutMs: remaining(true) });
      } catch (error) {
        cleanupFailure = String(error.message ?? error);
        note('stop_request_error', cleanupFailure);
      }
      // Independently observe even if the stop request itself failed.
      try {
        stopped = await io.status({ timeoutMs: remaining(true) }) === 'TERMINATED';
        if (!stopped) cleanupFailure ??= 'helper_stop_not_confirmed';
      } catch (error) {
        cleanupFailure ??= String(error.message ?? error);
      }
      note(stopped ? 'stopped_confirmed' : 'stop_unconfirmed');
    }
  }
  return {
    pass: archiveVerified && stopped && !failure && !cleanupFailure,
    startAttempted, archiveVerified, stopped, failure, cleanupFailure, events,
  };
}
