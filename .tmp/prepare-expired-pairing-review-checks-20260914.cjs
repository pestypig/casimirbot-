const fs = require('node:fs');
for (const base of ['compare', 'scan']) {
  const old = base === 'compare' ? '.tmp/compare-pairing-review-polling-20260914.cjs' : '.tmp/scan-pairing-review-polling-fixtures-20260914.cjs';
  const next = old.replaceAll('pairing-review-polling', 'expired-pairing-review');
  let text = fs.readFileSync(old, 'utf8').replaceAll('pairing-review-polling', 'expired-pairing-review');
  if (base === 'scan') text = text.replace("const markers = [", "const markers = ['fixture-review-initialized',");
  fs.writeFileSync(next, text, { flag: 'wx' });
}
