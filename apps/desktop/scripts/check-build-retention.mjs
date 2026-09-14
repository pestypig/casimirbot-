import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builds = fs.readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name.startsWith('release-'))
  .filter(entry => fs.existsSync(path.join(root, entry.name, 'win-unpacked', 'CasimirBot.exe')))
  .map(entry => entry.name).sort();
console.log(`[desktop-retention] ${builds.length} completed development packages: ${builds.join(', ') || 'none'}`);
if (builds.length >= 3) {
  console.error('Packaging paused: retain the running package and one verified rollback, then recycle superseded development packages before building another. Preserve evidence and the main release directory. This check never deletes files.');
  process.exitCode = 1;
}
