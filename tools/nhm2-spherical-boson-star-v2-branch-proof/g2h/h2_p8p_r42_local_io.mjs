import { mkdirSync, lstatSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync, statfsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export function inspect(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not_regular_file');
  if (stat.size > 1048576) throw new Error('local_file_limit');
  return { bytes: stat.size, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') };
}
export function writeExclusive(path, content) {
  const fd = openSync(path, 'wx');
  try { writeFileSync(fd, content); fsyncSync(fd); } finally { closeSync(fd); }
}
export function copyExclusive(source, destination) {
  inspect(source);
  writeExclusive(destination, readFileSync(source));
}
export function localStore(shortRoot, evidenceRoot, volumeRoot) {
  let download;
  return {
    freeBytes() {
      const fs = statfsSync(volumeRoot, { bigint: true });
      return Number(fs.bavail * fs.bsize);
    },
    prepare() {
      // No recursive creation: existing roots are a terminal error.
      mkdirSync(evidenceRoot);
      mkdirSync(shortRoot);
      download = join(mkdtempSync(join(shortRoot, 'download-')), 'r40.tgz');
      writeExclusive(join(evidenceRoot, 'started.utc.txt'), new Date().toISOString());
    },
    get download() {
      if (!download) throw new Error('store_not_prepared');
      return download;
    },
    receipt(name, data) { writeExclusive(join(evidenceRoot, name), JSON.stringify(data, null, 2)); },
    inspectArchive() { return inspect(download); },
    publish() { copyExclusive(download, join(evidenceRoot, 'r40.tgz')); },
    inspectPublished() { return inspect(join(evidenceRoot, 'r40.tgz')); },
  };
}
