const fs = require('node:fs');
const draft = fs.readFileSync('.tmp/durable-review-cs5-handoff.md', 'utf8');
const checkpoint = [
  'The [final packaged review](2026-09-13-durable-review-launch.json) passed its',
  'idle test: after the 03:03:45.449Z presence deadline, native inspection at',
  '03:03:51Z still showed the exact unselected run and the revalidation label.',
  'Human consent remained unchecked. The authenticated task was selected, and',
  'fresh Fabric source data resumed without a source rotation request.',
  '',
  'Final package: `apps/desktop/release-durable-review-20260913/win-unpacked`.',
  'EXE SHA256: `cdc21db8914224ea284898e033e72e0bae438297ab09aae3038046f653d83a97`.',
  'Runtime manifest SHA256:',
  '`03a8c5e3b979ff12f682a50c70cf44d4b1512b2b8b7531429b4aa61833c415ba`.',
  'The EXE hash alone cannot distinguish the two latest UI builds; the renderer',
  'and runtime manifest do. The [content comparison](2026-09-13-durable-review-package.json)',
  'matched 646 runtime files, 635 renderer files and eight host artifacts. The',
  '[known fixture scan](2026-09-13-durable-review-fixture-scan.json) passed.',
  'Only the running development package and one verified rollback were retained;',
  'superseded builds were recycled, and the Recycle Bin was not emptied.',
  '',
  'No warp, adapter, constraint-pack, certificate or release-verifier code changed',
  'in this polling/presentation repair. The earlier native-launcher adapter',
  'verification retains only its recorded scope and is not repeated as proof of',
  'this UI or of live session acceptance.',
  '',
].join('\n');
if (!draft.includes('## Requirement-by-requirement handoff')) throw new Error('Unexpected handoff draft');
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-13-durable-review-cs5-handoff.md',
  draft.replace('## Requirement-by-requirement handoff', checkpoint + '\n## Requirement-by-requirement handoff'), {flag:'wx'});
