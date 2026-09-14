const fs = require('node:fs');
const file = 'client/src/components/agent-access/DurableTaskPairing.tsx';
let data = fs.readFileSync(file);
function replace(oldText, newText) {
  const old = Buffer.from(oldText.replace(/\n/g, '\r\n'));
  const next = Buffer.from(newText.replace(/\n/g, '\r\n'));
  const at = data.indexOf(old);
  if (at < 0 || data.indexOf(old, at + 1) >= 0) throw new Error('Expected one exact source span');
  data = Buffer.concat([data.subarray(0, at), next, data.subarray(at + old.length)]);
}
replace('  const inFlight = useRef(false);', '  const inFlight = useRef(false);\n  const backgroundRead = useRef<Promise<void> | null>(null);');
replace(`  const run = async (operation: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try { await operation(); }`, `  const run = async (operation: () => Promise<void>, background = false) => {
    if (inFlight.current || (background && backgroundRead.current)) return;
    if (!background) { inFlight.current = true; setBusy(true); }
    const perform = async () => {
    try {
      // Polling must not close selectors or drop an explicit click. Reserve
      // one foreground operation while the bounded read finishes; do not retry
      // mutations or carry a queued operation into another owner/chat mount.
      if (!background && backgroundRead.current) await backgroundRead.current;
      if (!alive.current) return;
      if (!background) setMessage("");
      await operation();
    }`);
replace('    finally { inFlight.current = false; if (alive.current) setBusy(false); }', `    finally { if (!background) { inFlight.current = false; if (alive.current) setBusy(false); } }
    };
    const pending = perform();
    if (background) backgroundRead.current = pending;
    try { await pending; }
    finally { if (background && backgroundRead.current === pending) backgroundRead.current = null; }`);
replace('      void run(async () => { await refreshPrevious(); if (pairing) await refreshPairing(pairing.id); });', '      void run(async () => { await refreshPrevious(); if (pairing) await refreshPairing(pairing.id); }, true);');
replace('  const runChoice = review.environment ?? environment ?? lastOfferedEnvironment;', `  const runChoice = review.environment ?? environment ?? lastOfferedEnvironment;
  const currentEnvironment = environment ?? lastOfferedEnvironment;
  const differentRunAvailable = review.environment && currentEnvironment &&
    (review.environment.roomId !== currentEnvironment.roomId || review.environment.runId !== currentEnvironment.runId);`);
replace('    {(automaticAvailable || review.invitationDelivery === "automatic") && <label className="block">Invitation delivery', `    {!submitted && differentRunAvailable && <button type="button" disabled={busy}
      className="my-2 min-h-11 rounded-md border border-cyan-300/40 px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
      onClick={() => change({ environment: null })}>
      Review current environment run {currentEnvironment.runId}
    </button>}
    {(automaticAvailable || review.invitationDelivery === "automatic") && <label className="block">Invitation delivery`);
fs.writeFileSync(file, data);
console.log('Applied exact byte-span edits; unrelated encoding bytes preserved.');
