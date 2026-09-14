const fs = require('node:fs');
const file = 'client/src/components/agent-access/DurableTaskPairing.tsx';
const bytes = fs.readFileSync(file);
const source = bytes.toString('latin1');
const before = '{(!pairing || pairing.state === "pending") && <button type="button" disabled={busy';
const after = '{(!pairing || pairing.state === "pending") && <button type="button" className="my-3 inline-flex min-h-11 items-center justify-center rounded-md border border-cyan-200 bg-cyan-300 px-4 py-2 text-left text-sm font-semibold text-slate-950 shadow-sm hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy';
if (source.split(before).length !== 2) throw new Error('Expected one exact approval-button target');
fs.writeFileSync(file, Buffer.from(source.replace(before, after), 'latin1'));
console.log('Styled the approval/reconciliation action; all other bytes preserved.');
