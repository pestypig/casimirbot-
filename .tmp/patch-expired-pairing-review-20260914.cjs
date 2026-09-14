const fs = require('node:fs');
const file = 'client/src/components/agent-access/DurableTaskPairing.tsx';
let data = fs.readFileSync(file);
function replace(before, after) {
  const old = Buffer.from(before.replace(/\n/g, '\r\n'));
  const next = Buffer.from(after.replace(/\n/g, '\r\n'));
  const at = data.indexOf(old);
  if (at < 0 || data.indexOf(old, at + 1) >= 0) throw new Error('Expected one exact source span');
  data = Buffer.concat([data.subarray(0, at), next, data.subarray(at + old.length)]);
}
replace('  const change = (patch: Partial<PairingInvitationRequest>) => {', `  const reviewAfterPreviousEnded = () => run(async () => {
    if (submitted || !previous || !review.replacement) return;
    // A displayed deadline is not authority. Reinspect the exact prior grant
    // before releasing only this unsubmitted local replacement review.
    const value = await refreshPrevious();
    if (!alive.current || !value || !["expired", "revoked", "superseded"].includes(value.state)) return;
    const next = { ...review, replacement: undefined, requestId: crypto.randomUUID() };
    localStorage.setItem(storageKey + ":draft", JSON.stringify(next));
    localStorage.removeItem(storageKey + ":previous");
    setReview(next); setPrevious(null); setPreviousChecked(false); setApproved(false);
    setInvitation(null); setRuntimeMessage(""); setDeliveryMessage("");
    setMessage("The previous pairing has ended. Review this selection and approve a new invitation when ready.");
  });
  const change = (patch: Partial<PairingInvitationRequest>) => {`);
replace('      {previous && (!submitted || (pairing && !["pending", "accepted"].includes(pairing.state))) &&', `      {!submitted && previousChecked && previous && ["expired", "revoked", "superseded"].includes(previous.pairing.state) && <div>
        <p>The previous pairing has ended, so this replacement cannot be approved. Start a new review to continue.</p>
        <button type="button" disabled={busy}
          className="my-2 min-h-11 rounded-md border border-cyan-300/40 px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
          onClick={() => void reviewAfterPreviousEnded()}>Review a new invitation</button>
      </div>}
      {previous && (!submitted || (pairing && !["pending", "accepted"].includes(pairing.state))) &&`);
fs.writeFileSync(file, data);
